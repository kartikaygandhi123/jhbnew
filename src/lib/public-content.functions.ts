import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

export const getPublicArticle = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ key: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

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
