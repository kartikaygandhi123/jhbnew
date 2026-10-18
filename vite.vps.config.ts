import { defineConfig } from '@lovable.dev/vite-tanstack-config';
import { fileURLToPath } from 'node:url';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));
// Optional: set these to your own Supabase project when building for the VPS.
// If left unset, use the same external backend configured for the preview
// in src/lib/backend-config.ts. There is no Lovable Cloud write fallback.
const backendUrl = process.env['VITE_SUPABASE_URL'];
const publishableKey = process.env['VITE_SUPABASE_PUBLISHABLE_KEY'];

// Separate production target: the editor continues using vite.config.ts unchanged.
export default defineConfig({
  envDefine: false,
  nitro: { preset: 'node-server' },
  tanstackStart: { server: { entry: 'server' } },
  vite: {
    define: {
      'import.meta.env.VITE_EXTERNAL_HOSTING': JSON.stringify('true'),
      ...(backendUrl ? { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(backendUrl) } : {}),
      ...(publishableKey ? { 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(publishableKey) } : {}),
    },
    resolve: { alias: [
      { find: /^@\/integrations\/supabase\/client$/, replacement: local('./src/lib/external-client.ts') },
      { find: /^@\/integrations\/supabase\/auth-attacher$/, replacement: local('./src/lib/external-auth-attacher.ts') },
      { find: /^@\/integrations\/lovable\/index$/, replacement: local('./src/lib/external-oauth.ts') },
    ] },
    plugins: [{
      name: 'external-media-pointers',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('.asset.json')) return;
        const asset = JSON.parse(code);
        asset.url = `/api/public/media/migrated/assets/${asset.asset_id}/${asset.original_filename}`;
        return { code: JSON.stringify(asset), map: null };
      },
    }],
  },
});