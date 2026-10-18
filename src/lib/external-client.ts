import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// External (self-hosted / VPS) backend connection.
//
// WHERE TO PUT YOUR OWN SUPABASE DETAILS:
//   Set these two environment variables when building for your VPS
//   (e.g. in the GitHub Actions secrets / server .env used by vite.vps.config.ts):
//     VITE_SUPABASE_URL            = https://clivjzpotoiqfwqzwqck.supabase.co
//     VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_...
//
// FALLBACK: if they are missing or unreachable, the site keeps working by
// using the Lovable Cloud backend below, so nothing breaks while you migrate.
const LOVABLE_FALLBACK_URL = 'https://goczitjmonpfjddzmwve.supabase.co';
const LOVABLE_FALLBACK_KEY = 'sb_publishable_4QIV98D75uZlN0sIPphiRQ_7u-_LnC9';

let client: ReturnType<typeof createClient<Database>> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, property) {
    if (!client) {
      const url = import.meta.env['VITE_SUPABASE_URL'] || LOVABLE_FALLBACK_URL;
      const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || LOVABLE_FALLBACK_KEY;
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
