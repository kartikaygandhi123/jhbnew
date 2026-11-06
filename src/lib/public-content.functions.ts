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
      const origin = process.env['SITE_ORIGIN'] || requestOrigin();
      // Article photo first; otherwise the article's video thumbnail, so every shared link previews this news.
      const videoId = parseYouTubeId((article as { youtube_id?: string | null }).youtube_id);
      const imageUrl = article.image_url?.startsWith('https://')
        ? article.image_url
        : origin && article.image_url
          ? new URL(article.image_url, origin).href
          : videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
      return { article, imageUrl };
    };
    if (bySlug.data) return withPreview(bySlug.data);

    if (!/^[0-9a-f-]{36}$/i.test(data.key)) return null;
    const byId = await supabasePublic
      .from("articles")
      .select("*")
      .eq("published", true)
      .eq("id", data.key)
      .maybeSingle();
    return byId.data ? withPreview(byId.data) : null;
  });
