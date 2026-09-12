import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AdRow = Database["public"]["Tables"]["ads"]["Row"];

/**
 * Advertisement reads/writes go through server functions on purpose:
 * browser ad-blockers cancel any request whose URL contains "ads",
 * which made direct Data API calls fail with "Failed to fetch".
 */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listActivePromos = createServerFn({ method: "GET" }).handler(async (): Promise<AdRow[]> => {
  const { data, error } = await publicClient().from("ads").select("*").eq("active", true).order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listAllPromos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdRow[]> => {
    const { data, error } = await context.supabase.from("ads").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const promoInput = z.object({
  id: z.string().uuid().optional(),
  placement: z.string().default("header-center"),
  title: z.string().default(""),
  image_url: z.string().nullable().default(null),
  link_url: z.string().default(""),
  alt_text: z.string().default(""),
  width: z.number().default(728),
  height: z.number().default(90),
  dismissible: z.boolean().default(true),
  active: z.boolean().default(true),
  sort_order: z.number().default(100),
});

export const savePromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => promoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...values } = data;
    if (id) {
      const { error } = await context.supabase.from("ads").update(values).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("ads").insert(values);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deletePromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
