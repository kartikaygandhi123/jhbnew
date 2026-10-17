import { supabase } from './external-client';

export const lovable = {
  auth: {
    async signInWithOAuth(provider: 'google', _options: { redirect_uri: string }) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      return { error, redirected: !error };
    },
  },
};