import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

let client: ReturnType<typeof createClient<Database>> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, property) {
    if (!client) {
      const url = import.meta.env['VITE_SUPABASE_URL'];
      const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
      if (!url || !key) throw new Error('Website connection is not configured');
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