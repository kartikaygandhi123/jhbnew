import { createServerOnlyFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { EXTERNAL_BACKEND_URL, EXTERNAL_BACKEND_PUBLISHABLE_KEY } from './backend-config';
import { backendFetch } from './media-urls';

export const createBackendServerClient = createServerOnlyFn((token?: string) => {
  const vps = import.meta.env['VITE_EXTERNAL_HOSTING'] === 'true';
  const url = (vps ? process.env['SUPABASE_URL'] : process.env['EXTERNAL_SUPABASE_URL']) || EXTERNAL_BACKEND_URL;
  const key = (vps ? process.env['SUPABASE_PUBLISHABLE_KEY'] : process.env['EXTERNAL_SUPABASE_PUBLISHABLE_KEY']) || EXTERNAL_BACKEND_PUBLISHABLE_KEY;
  if (vps && (url !== EXTERNAL_BACKEND_URL || key !== EXTERNAL_BACKEND_PUBLISHABLE_KEY)) throw new Error('Build-time and runtime backend configuration must match');
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      fetch: backendFetch(key),
    },
  });
});