import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createBackendServerClient } from "@/lib/backend-server";

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
      const origin = process.env['SITE_ORIGIN'];
      const imageUrl = article.image_url?.startsWith('https://') ? article.image_url : origin && article.image_url ? new URL(article.image_url, origin).href : null;
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
