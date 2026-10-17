// Run only on a trusted operator machine. Never writes record exports or secrets.
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const required = name => { const value=process.env[name]; if(!value) throw new Error(`Missing ${name}`); return value; };
const tables = ['profiles','user_roles','categories','articles','videos','live_channels','trending_tags','epaper_editions','epaper_pages','site_settings','ads'];
function admin(url, key) {
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{
    const headers=new Headers(init?.headers); if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey',key); return fetch(input,{...init,headers});
  }}});
}
async function pointers(dir) {
  const result=[];
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const path=join(dir,item.name);
    if(item.isDirectory()) result.push(...await pointers(path));
    else if(item.name.endsWith('.asset.json')) result.push(JSON.parse(await readFile(path,'utf8')));
  }
  return result;
}
async function migrate() {
  const destinationUrl=required('EXTERNAL_SUPABASE_URL');
  const parsed=new URL(destinationUrl);
  if(parsed.protocol!=='https:' || (parsed.pathname!=='/' && parsed.pathname!=='')) throw new Error('Destination API URL must be a project origin, not a dashboard URL');
  const destination=postgres(required('EXTERNAL_DATABASE_URL'),{max:1,ssl:'require',connect_timeout:15});
  const source=process.env.SUPABASE_DB_URL ? postgres(process.env.SUPABASE_DB_URL,{max:1}) : postgres({max:1});
  const targetAdmin=admin(destinationUrl,required('EXTERNAL_SUPABASE_SECRET_KEY'));
  const sourceAdmin=admin(required('SUPABASE_URL'),required('SUPABASE_SERVICE_ROLE_KEY'));
  try {
    await destination`select 1`;
    const sourceTables=await source`select tablename from pg_tables where schemaname='public'`;
    if(tables.some(t=>!sourceTables.some(r=>r.tablename===t))) throw new Error('Source schema is incomplete');
    const existing=await destination`select tablename from pg_tables where schemaname='public'`;
    const marked=existing.some(t=>t.tablename==='jhb_migration_state');
    if(existing.length && !marked) throw new Error('Destination is not empty; refusing to overwrite unrelated data');
    if(!marked) {
      const dump=spawnSync('pg_dump',['--schema-only','--schema=public','--no-owner','--no-comments'],{encoding:'utf8',maxBuffer:20*1024*1024});
      if(dump.status!==0) throw new Error('Schema export failed; source PG connection must match source database');
      const schema=dump.stdout.split('\n').filter(line=>!line.startsWith('\\') && !/^CREATE SCHEMA public;/.test(line)).join('\n');
      await destination.begin(async tx=>{
        await tx.unsafe(schema);
        await tx.unsafe(`CREATE TABLE public.jhb_migration_state(id text primary key, completed_at timestamptz); GRANT ALL ON public.jhb_migration_state TO service_role; ALTER TABLE public.jhb_migration_state ENABLE ROW LEVEL SECURITY;`);
        // Do not grant the first public signup admin privileges on an external service.
        await tx.unsafe(`CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.profiles(id,email,display_name) VALUES(NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.email)) ON CONFLICT(id) DO NOTHING; RETURN NEW; END; $$; REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated; CREATE TRIGGER jhb_auth_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`);
      });
      console.log('Schema and access policies copied');
    }
    const users=await source`select id,email,encrypted_password,email_confirmed_at,raw_user_meta_data,raw_app_meta_data from auth.users order by created_at`;
    for(const user of users) {
      const found=await targetAdmin.auth.admin.getUserById(user.id);
      if(found.data?.user) continue;
      if(!user.email) throw new Error('A source identity has no email; manual identity transfer required');
      const result=await targetAdmin.auth.admin.createUser({id:user.id,email:user.email,...(user.encrypted_password?{password_hash:user.encrypted_password}:{}),email_confirm:Boolean(user.email_confirmed_at),user_metadata:user.raw_user_meta_data,app_metadata:{...user.raw_app_meta_data,provider:'email',providers:['email']}});
      if(result.error) throw new Error('Identity transfer failed');
    }
    console.log(`Transferred auth accounts: ${users.length}; existing passwords preserved where available; OAuth needs provider relinking`);
    const bucket=await targetAdmin.storage.getBucket('media');
    if(bucket.error) {
      const created=await targetAdmin.storage.createBucket('media',{public:false,fileSizeLimit:104857600});
      if(created.error) throw new Error('Destination media bucket creation failed');
    }
    const storagePolicies=await source`select polname,polcmd,pg_get_expr(polqual,polrelid) as using_expr,pg_get_expr(polwithcheck,polrelid) as check_expr, array(select rolname from pg_roles where oid=any(polroles)) as roles from pg_policy where polrelid='storage.objects'::regclass`;
    const commands={r:'SELECT',a:'INSERT',w:'UPDATE',d:'DELETE','*':'ALL'};
    const quote=name=>`"${name.replaceAll('"','""')}"`;
    for(const policy of storagePolicies.filter(p=>(p.using_expr??p.check_expr??'').includes("'media'"))) {
      const present=await destination`select 1 from pg_policy where polrelid='storage.objects'::regclass and polname=${policy.polname}`;
      if(!present.length) await destination.unsafe(`CREATE POLICY ${quote(policy.polname)} ON storage.objects FOR ${commands[policy.polcmd]} TO ${policy.roles.length?policy.roles.map(quote).join(','):'PUBLIC'} ${policy.using_expr?`USING (${policy.using_expr})`:''} ${policy.check_expr?`WITH CHECK (${policy.check_expr})`:''}`);
    }
    const copies=new Map();
    async function copy(path, bytes, type) {
      const uploaded=await targetAdmin.storage.from('media').upload(path,bytes,{upsert:true,contentType:type||'application/octet-stream',cacheControl:'31536000'});
      if(uploaded.error) throw new Error('Media transfer failed');
      const downloaded=await targetAdmin.storage.from('media').download(path);
      if(downloaded.error || !downloaded.data || downloaded.data.size!==bytes.size || !Buffer.from(await downloaded.data.arrayBuffer()).equals(Buffer.from(await bytes.arrayBuffer()))) throw new Error('Transferred media verification failed');
    }
    async function copyAsset(value, asset) {
      if(copies.has(value)) return copies.get(value);
      const sourceOrigin=process.env.MIGRATION_SOURCE_ORIGIN || 'http://localhost:8080';
      const response=await fetch(new URL(value,sourceOrigin));
      if(!response.ok) throw new Error('Source asset is unavailable');
      const path=`migrated/assets/${asset.asset_id}/${asset.original_filename}`;
      await copy(path,await response.blob(),response.headers.get('content-type'));
      const replaced=`/api/public/media/${path}`;
      copies.set(value,replaced);
      return replaced;
    }
    // Include fallback logos and all checked-in asset pointers, not just current rows.
    for(const pointer of await pointers('src/assets')) await copyAsset(pointer.url,pointer);
    let storageCount=0;
    async function storageFolder(prefix='') {
      for(let offset=0;;offset+=100) {
        const listed=await sourceAdmin.storage.from('media').list(prefix,{limit:100,offset});
        if(listed.error) throw new Error('Source storage listing failed');
        for(const object of listed.data??[]) {
          const path=prefix?`${prefix}/${object.name}`:object.name;
          if(!object.id) await storageFolder(path);
          else {const file=await sourceAdmin.storage.from('media').download(path); if(file.error||!file.data) throw new Error('Source upload download failed'); await copy(path,file.data,file.data.type); storageCount++;}
        }
        if((listed.data?.length??0)<100) break;
      }
    }
    await storageFolder();
    async function rewrite(value) {
      if(Array.isArray(value)) return Promise.all(value.map(rewrite));
      if(value && typeof value==='object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key,val])=>[key,await rewrite(val)])));
      if(typeof value!=='string') return value;
      const match=value.match(/(?:https:\/\/[^/]+)?(\/__l5e\/assets-v1\/([^/]+)\/([^\s"'<>]+))/);
      if(match) {
        const replacement=await copyAsset(match[1],{asset_id:match[2],original_filename:decodeURIComponent(match[3])});
        return value.replace(match[0],replacement);
      }
      // Existing media URLs retain paths and are served from destination storage.
      const media=value.match(/^https:\/\/[^/]+(\/api\/public\/media\/.+)$/);
      if(media) return media[1];
      const stored=value.match(/\/storage\/v1\/object\/(?:public|sign)\/media\/([^?]+)(?:\?.*)?$/);
      if(stored) return `/api/public/media/${stored[1]}`;
      return value;
    }
    for(const table of tables) {
      const prior=await destination`select id from public.jhb_migration_state where id=${table}`;
      if(prior.length) {console.log(`${table}: previously transferred; not overwriting newsroom edits`); continue;}
      const records=await source.unsafe(`select * from public."${table}"`);
      const rewritten=await Promise.all(records.map(rewrite));
      await destination.begin(async tx=>{
        for(const record of rewritten) {
          const columns=Object.keys(record), assignments=columns.filter(c=>c!=='id');
          await tx.unsafe(`insert into public."${table}" (${columns.map(c=>`"${c}"`).join(',')}) values (${columns.map((_,i)=>`$${i+1}`).join(',')}) on conflict (id) do update set ${assignments.map(c=>`"${c}"=excluded."${c}"`).join(',')}`,columns.map(c=>record[c]));
        }
        const count=await tx.unsafe(`select count(*)::int as n from public."${table}"`);
        if(count[0].n!==records.length) throw new Error('Record count mismatch');
        await tx`insert into public.jhb_migration_state(id,completed_at) values(${table},now())`;
      });
      console.log(`${table}: verified ${records.length} records`);
    }
    console.log(`Media verified: ${storageCount} uploaded objects, ${copies.size} asset URLs. Source remains unchanged.`);
    console.log('Copy complete. Verify sign-in, editing, media and production URLs before DNS cutover. Auth provider settings, SMTP and OAuth identities are not copied automatically.');
  } finally {await source.end({timeout:3});await destination.end({timeout:3});}
}
migrate().catch(()=>{console.error('Migration stopped safely. Check destination project API URL, database password/connection string, keys, and permissions. No source content was deleted.');process.exitCode=1;});