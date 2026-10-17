import { createClient } from '@supabase/supabase-js';
import { CHANNEL_HANDLE, chooseBroadcast } from './youtube-rules.mjs';

const required = name => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value; };
async function main() {
  const key = required('YOUTUBE_API_KEY');
  async function youtube(resource, params) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
    for (const [name, value] of Object.entries({ ...params, key })) url.searchParams.set(name, value);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube refresh failed (${response.status}); previous cache retained`);
    return response.json();
  }
  const channel = (await youtube('channels', {part:'contentDetails',forHandle:CHANNEL_HANDLE})).items?.[0];
  if (!channel) throw new Error('News channel could not be resolved');
  const items = (await youtube('playlistItems', {part:'snippet,contentDetails',playlistId:channel.contentDetails.relatedPlaylists.uploads,maxResults:'30'})).items ?? [];
  const videos = items.map((item, index) => ({id:`youtube-${item.contentDetails.videoId}`,youtube_id:item.contentDetails.videoId,title:item.snippet.title,duration:'',category:'जय हिन्द भारत',time_label:item.snippet.publishedAt.slice(0,10),sort_order:index,published:true,created_at:item.snippet.publishedAt,updated_at:item.snippet.publishedAt}));
  const live = (await youtube('search', {part:'snippet',channelId:channel.id,eventType:'live',type:'video',maxResults:'1'})).items?.[0];
  if (!videos.length && !live) throw new Error('No videos found; previous cache retained');
  const broadcast = chooseBroadcast(videos, live);
  const url = required('SUPABASE_URL'), secret = required('SUPABASE_SERVICE_ROLE_KEY');
  const storage = createClient(url, secret, {auth:{persistSession:false},global:{fetch:(input,init)=>{
    const headers=new Headers(init?.headers); if(secret.startsWith('sb_') && headers.get('Authorization')===`Bearer ${secret}`) headers.delete('Authorization'); headers.set('apikey',secret); return fetch(input,{...init,headers});
  }}});
  const {error} = await storage.storage.from('media').upload('youtube/cache.json', new Blob([JSON.stringify({updated_at:new Date().toISOString(),videos,broadcast})],{type:'application/json'}),{upsert:true,cacheControl:'300'});
  if(error) throw new Error('Video cache could not be saved; previous cache retained');
  console.log(`Updated cached videos: ${videos.length}; live: ${Boolean(broadcast?.is_live)}`);
}
main().catch(() => { console.error('YouTube update failed. Check credentials, API access and storage permissions; previous cache retained.'); process.exitCode=1; });