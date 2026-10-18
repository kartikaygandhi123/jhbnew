import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { EXTERNAL_BACKEND_URL, EXTERNAL_BACKEND_PUBLISHABLE_KEY } from './backend-config';

// External (self-hosted / VPS) backend connection.
//
// WHERE TO PUT YOUR OWN SUPABASE DETAILS:
//   Set these two environment variables when building for your VPS
//   (e.g. in the GitHub Actions secrets / server .env used by vite.vps.config.ts):
//     VITE_SUPABASE_URL            = https://clivjzpotoiqfwqzwqck.supabase.co
//     VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_...
//
// Preview and VPS use one content source. Never fall back during a failed write
// or sign-in: doing so would silently split staff accounts and newsroom content.

let client: ReturnType<typeof createClient<Database>> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, property) {
    if (!client) {
      const vps = import.meta.env['VITE_EXTERNAL_HOSTING'] === 'true';
      const url = (vps ? import.meta.env['VITE_SUPABASE_URL'] : undefined) || EXTERNAL_BACKEND_URL;
      const key = (vps ? import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] : undefined) || EXTERNAL_BACKEND_PUBLISHABLE_KEY;
      client = createClient<Database>(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        global: { fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
          headers.set('apikey', key);
          return fetch(input, { ...init, headers });
        } },
      });
    }
    return Reflect.get(client, property);
  },
});
