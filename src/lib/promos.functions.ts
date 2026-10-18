import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/lib/external-auth-middleware";
import { createBackendServerClient } from "@/lib/backend-server";
import type { Database } from "@/integrations/supabase/types";

type AdRow = Database["public"]["Tables"]["ads"]["Row"];

/**
 * Advertisement reads/writes go through server functions on purpose:
 * browser ad-blockers cancel any request whose URL contains "ads",
 * which made direct Data API calls fail with "Failed to fetch".
 */
export const listActivePromos = createServerFn({ method: "GET" }).handler(async (): Promise<AdRow[]> => {
  const { data, error } = await createBackendServerClient().from("ads").select("*").eq("active", true).order("sort_order");
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
