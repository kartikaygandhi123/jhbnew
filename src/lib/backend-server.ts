import { createServerOnlyFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { EXTERNAL_BACKEND_URL, EXTERNAL_BACKEND_PUBLISHABLE_KEY } from './backend-config';

export const createBackendServerClient = createServerOnlyFn((token?: string) => {
  const vps = import.meta.env['VITE_EXTERNAL_HOSTING'] === 'true';
  const url = process.env['EXTERNAL_SUPABASE_URL'] || (vps ? process.env['SUPABASE_URL'] : undefined) || EXTERNAL_BACKEND_URL;
  const key = process.env['EXTERNAL_SUPABASE_PUBLISHABLE_KEY'] || (vps ? process.env['SUPABASE_PUBLISHABLE_KEY'] : undefined) || EXTERNAL_BACKEND_PUBLISHABLE_KEY;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      },
    },
  });
});