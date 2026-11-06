import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/external-client";

/** Current Supabase session (client-side only). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

/** Whether the signed-in user may edit site content. */
export function useIsStaff(userId: string | undefined) {
  return useQuery({
    queryKey: ["is_staff", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId ?? "");
      if (error) throw error;
      return (data ?? []).some((r) => r.role === "admin" || r.role === "editor");
    },
  });
}

export interface ReporterPermissions {
  add_articles: boolean;
  edit_own_articles: boolean;
  delete_own_articles: boolean;
  publish_articles: boolean;
  add_videos: boolean;
}

export const NO_PERMISSIONS: ReporterPermissions = {
  add_articles: false,
  edit_own_articles: false,
  delete_own_articles: false,
  publish_articles: false,
  add_videos: false,
};

export type StaffAccess =
  | { kind: "admin" | "editor" }
  | { kind: "reporter"; perms: ReporterPermissions }
  | { kind: "none" };

/** Newsroom access level of the signed-in user (admin/editor = full panel, reporter = own news only). */
export function useStaffAccess(userId: string | undefined) {
  return useQuery({
    queryKey: ["staff_access", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<StaffAccess> => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId ?? "");
      if (error) throw error;
      const roles = (data ?? []).map((r) => String(r.role));
      if (roles.includes("admin")) return { kind: "admin" };
      if (roles.includes("editor")) return { kind: "editor" };
      if (!roles.includes("reporter")) return { kind: "none" };
      const { data: perms } = await supabase
        .from("staff_permissions" as never)
        .select("*")
        .eq("user_id", userId ?? "")
        .maybeSingle();
      return { kind: "reporter", perms: { ...NO_PERMISSIONS, ...((perms ?? {}) as Partial<ReporterPermissions>) } };
    },
  });
}
