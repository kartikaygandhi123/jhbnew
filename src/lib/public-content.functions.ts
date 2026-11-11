import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { createBackendServerClient } from "@/lib/backend-server";
import { parseYouTubeId } from "@/lib/youtube";

/** Public https origin of the current request (respects the proxy's forwarded host). */
function requestOrigin(): string | null {
  try {
    const request = getRequest();
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (!host || /^(localhost|127\.)/.test(host)) return null;
    return `https://${host.split(",")[0]!.trim()}`;
  } catch {
    return null;
  }
}

export const getPublicArticle = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ key: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const supabasePublic = createBackendServerClient();

    const bySlug = await supabasePublic
      .from("articles")
      .select("*")
      .eq("published", true)
      .eq("slug", data.key)
      .maybeSingle();
    const withPreview = (article: NonNullable<typeof bySlug.data>) => {
      const origin = process.env['SITE_ORIGIN'] || requestOrigin() || 'https://jaihindbharat.com';
      // Article photo first; otherwise the article's video thumbnail, so every shared link previews this news.
      const videoId = parseYouTubeId((article as { youtube_id?: string | null }).youtube_id);
      const raw = article.image_url?.trim();
      const imageUrl = raw && /^https?:\/\//.test(raw)
        ? raw.replace(/^http:\/\//, 'https://')
        : raw
          ? new URL(raw, origin).href
          : videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
      return { article, imageUrl, shareUrl: `${origin}/article/${article.id.slice(0, 8)}` };
    };
    if (bySlug.data) return withPreview(bySlug.data);

    // Short share code: first 8 characters of the article id (e.g. /article/1a2b3c4d).
    if (/^[0-9a-f]{8}$/i.test(data.key)) {
      const code = data.key.toLowerCase();
      const byCode = await supabasePublic
        .from("articles")
        .select("*")
        .eq("published", true)
        .gte("id", `${code}-0000-0000-0000-000000000000`)
        .lte("id", `${code}-ffff-ffff-ffff-ffffffffffff`)
        .limit(1);
      const hit = byCode.data?.[0];
      return hit ? withPreview(hit) : null;
    }
    if (!/^[0-9a-f-]{36}$/i.test(data.key)) return null;
    const byId = await supabasePublic
      .from("articles")
      .select("*")
      .eq("published", true)
      .eq("id", data.key)
      .maybeSingle();
    return byId.data ? withPreview(byId.data) : null;
  });
