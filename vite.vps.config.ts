import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { nitro } from 'nitro/vite';

// Independent production stack; never reads the managed preview .env file.
export default defineConfig(() => {
  const url = process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'];
  const key = process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY before building the VPS release');
  if (url !== 'https://clivjzpotoiqfwqzwqck.supabase.co') throw new Error('VPS builds must use the existing external backend');
  if (key.startsWith('sb_secret_')) throw new Error('The browser requires a publishable key, never a private key');
  const origin = process.env['SITE_ORIGIN'];
  if (origin && new URL(origin).protocol !== 'https:') throw new Error('SITE_ORIGIN must use HTTPS');
  return {
    envDir: false,
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ['./tsconfig.json'] }),
      tanstackStart({ server: { entry: 'server' } }),
      nitro({ preset: 'node-server' }),
      react(),
    ],
    define: {
      'import.meta.env.VITE_EXTERNAL_HOSTING': JSON.stringify('true'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(key),
      'import.meta.env.VITE_EXTERNAL_BACKEND_URL': JSON.stringify(url),
      'import.meta.env.VITE_EXTERNAL_BACKEND_PUBLISHABLE_KEY': JSON.stringify(key),
    },
    resolve: { dedupe: ['react', 'react-dom', '@tanstack/react-router', '@tanstack/react-start'] },
  };
});