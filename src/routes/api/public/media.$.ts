import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { EXTERNAL_BACKEND_URL } from "@/lib/backend-config";

/**
 * Serves files uploaded by the newsroom staff to the private "media" bucket.
 * Read-only, no listing: the exact object path must be known.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!path || path.includes("..") || path.startsWith('/') || path.includes('\\')) {
          return new Response("Not found", { status: 404 });
        }
        const vps = import.meta.env['VITE_EXTERNAL_HOSTING'] === 'true';
        const url = (vps ? process.env['SUPABASE_URL'] : process.env['EXTERNAL_SUPABASE_URL']) || EXTERNAL_BACKEND_URL;
        const key = vps ? process.env['SUPABASE_SERVICE_ROLE_KEY'] : process.env['EXTERNAL_SUPABASE_SECRET_KEY'];
        if (url !== EXTERNAL_BACKEND_URL) return new Response('Media configuration mismatch', { status: 503 });
        if (!key) return new Response("Media temporarily unavailable", { status: 503 });
        const supabaseAdmin = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
            headers.set('apikey', key);
            return fetch(input, { ...init, headers });
          } },
        });
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        const safeType = /^(image\/(jpeg|png|webp|gif|avif)|application\/(pdf|json))(;|$)/i.test(data.type);
        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": path === 'youtube/cache.json' ? 'public, max-age=300, stale-while-revalidate=600' : "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff",
            ...(!safeType ? { "content-disposition": "attachment", "content-security-policy": "sandbox" } : {}),
          },
        });
      },
    },
  },
});
