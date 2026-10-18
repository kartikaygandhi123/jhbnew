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
    if (bySlug.data) return bySlug.data;

    if (!/^[0-9a-f-]{36}$/i.test(data.key)) return null;
    const byId = await supabasePublic
      .from("articles")
      .select("*")
      .eq("published", true)
      .eq("id", data.key)
      .maybeSingle();
    return byId.data;
  });
