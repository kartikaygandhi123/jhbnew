import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createBackendServerClient } from './backend-server';

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const header = getRequest().headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = header.slice(7);
  const supabase = createBackendServerClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Unauthorized');
  return next({ context: { supabase, userId: data.user.id } });
});