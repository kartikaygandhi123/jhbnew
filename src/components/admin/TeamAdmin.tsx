import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/external-client";
import { RETENTION_OPTIONS, RETENTION_ROW, mediaPathFromUrl, parseRetention, retentionCutoff, type RetentionMonths } from "@/lib/retention";
import { NO_PERMISSIONS, type ReporterPermissions } from "@/lib/useAuth";

export const REGISTRATION_ROW = "registration";

const PERMISSION_LABELS: { key: keyof ReporterPermissions; label: string }[] = [
  { key: "add_articles", label: "नई खबर जोड़ सकते हैं" },
  { key: "edit_own_articles", label: "अपनी खबर बदल सकते हैं" },
  { key: "delete_own_articles", label: "अपनी खबर हटा सकते हैं" },
  { key: "publish_articles", label: "सीधे प्रकाशित कर सकते हैं (वरना एडमिन मंज़ूरी)" },
  { key: "add_videos", label: "वीडियो जोड़ सकते हैं" },
];

const ROLE_OPTIONS = [
  { value: "", label: "कोई पहुंच नहीं" },
  { value: "reporter", label: "रिपोर्टर" },
  { value: "editor", label: "एडिटर (पूरा पैनल)" },
  { value: "admin", label: "एडमिन" },
];

async function readSetting(id: string): Promise<string | null> {
  const { data } = await supabase.from("site_settings").select("footer_text").eq("id", id).maybeSingle();
  return data?.footer_text ?? null;
}

async function writeSetting(id: string, value: string) {
  const { data, error } = await supabase.from("site_settings").upsert({ id, footer_text: value }).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("सेव नहीं हुआ — अनुमति जांचें");
}

export function useSettingValue(id: string) {
  return useQuery({ queryKey: ["site_settings", id], staleTime: 30_000, queryFn: () => readSetting(id) });
}

/** Deletes articles older than the chosen period, plus their uploaded photos. Returns the count. */
export async function purgeOldArticles(months: RetentionMonths): Promise<number> {
  const cutoff = retentionCutoff(months);
  if (!cutoff) return 0;
  const { data, error } = await supabase
    .from("articles")
    .select("id, image_url, is_homepage_main")
    .lt("created_at", cutoff.toISOString());
  if (error) throw error;
  const old = (data ?? []).filter((a) => !(a as { is_homepage_main?: boolean }).is_homepage_main);
  if (old.length === 0) return 0;
  const paths = old.map((a) => mediaPathFromUrl(a.image_url)).filter((p): p is string => Boolean(p));
  if (paths.length > 0) await supabase.storage.from("media").remove(paths);
  const { data: removed, error: delError } = await supabase
    .from("articles")
    .delete()
    .in("id", old.map((a) => a.id))
    .select("id");
  if (delError) throw delError;
  return removed?.length ?? 0;
}

/** Runs the clean-up at most once a day while an admin has the panel open. */
export function useAutoPurge(enabled: boolean) {
  const qc = useQueryClient();
  const { data: raw } = useSettingValue(RETENTION_ROW);
  useEffect(() => {
    const months = parseRetention(raw);
    if (!enabled || months === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("jhb-purge-day") === today) return;
    localStorage.setItem("jhb-purge-day", today);
    void purgeOldArticles(months).then(
      (n) => {
        if (n > 0) {
          toast.success(`${String(n)} पुरानी खबरें अपने आप हटाई गईं`);
          void qc.invalidateQueries();
        }
      },
      () => localStorage.removeItem("jhb-purge-day"),
    );
  }, [enabled, raw, qc]);
}

export function SiteControlsAdmin() {
  const qc = useQueryClient();
  const { data: reg } = useSettingValue(REGISTRATION_ROW);
  const { data: ret } = useSettingValue(RETENTION_ROW);
  const open = (reg ?? "open") === "open";
  const months = parseRetention(ret);

  const setSetting = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => writeSetting(id, value),
    onSuccess: () => {
      toast.success("सेव हो गया");
      void qc.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runNow = useMutation({
    mutationFn: () => purgeOldArticles(months),
    onSuccess: (n) => {
      toast.success(n > 0 ? `${String(n)} पुरानी खबरें हटाई गईं` : "हटाने लायक कोई पुरानी खबर नहीं");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-md border border-border bg-card p-3">
        <h2 className="text-sm font-bold">नया रजिस्ट्रेशन</h2>
        <p className="mt-1 text-[11px] text-muted-foreground">
          चालू होने पर लोग सिर्फ ईमेल और पासवर्ड से खाता बना सकते हैं। नए खाते को कोई अधिकार नहीं मिलता — नीचे टीम में भूमिका दें।
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={open}
            onChange={() => setSetting.mutate({ id: REGISTRATION_ROW, value: open ? "closed" : "open" })}
            className="h-4 w-4 accent-primary"
          />
          {open ? "रजिस्ट्रेशन खुला है" : "रजिस्ट्रेशन बंद है"}
        </label>
      </section>

      <section className="rounded-md border border-border bg-card p-3">
        <h2 className="text-sm font-bold">पुरानी खबरें अपने आप हटाएं</h2>
        <p className="mt-1 text-[11px] text-muted-foreground">
          चुनी अवधि से पुरानी खबरें और उनकी तस्वीरें हटा दी जाएंगी (होम पेज की मुख्य खबर छोड़कर)। यह रोज़ एक बार चलता है जब एडमिन पैनल खुलता है।
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={String(months)}
            onChange={(e) => setSetting.mutate({ id: RETENTION_ROW, value: e.target.value })}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {RETENTION_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "बंद" : `${String(m)} महीने बाद`}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={months === 0 || runNow.isPending}
            onClick={() => {
              if (window.confirm(`${String(months)} महीने से पुरानी सभी खबरें अभी हटाएं?`)) runNow.mutate();
            }}
            className="h-9 rounded-md border border-border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-40"
          >
            अभी चलाएं
          </button>
        </div>
      </section>
    </div>
  );
}

interface Member {
  id: string;
  email: string;
  role: string;
  perms: ReporterPermissions;
}

export function TeamAdmin({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const { data: members, isLoading } = useQuery({
    queryKey: ["admin", "team"],
    queryFn: async (): Promise<Member[]> => {
      const [profiles, roles, perms] = await Promise.all([
        supabase.from("profiles").select("id, email, display_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("staff_permissions" as never).select("*"),
      ]);
      if (profiles.error) throw profiles.error;
      const rank = ["admin", "editor", "reporter"];
      return (profiles.data ?? []).map((p) => {
        const own = (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => String(r.role));
        const perm = ((perms.data ?? []) as (ReporterPermissions & { user_id: string })[]).find((x) => x.user_id === p.id);
        return {
          id: p.id,
          email: p.email ?? p.display_name ?? p.id,
          role: rank.find((r) => own.includes(r)) ?? "",
          perms: { ...NO_PERMISSIONS, ...(perm ?? {}) },
        };
      });
    },
  });

  const refresh = () => void qc.invalidateQueries();

  const setRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", id);
      if (delError) throw delError;
      if (role) {
        const { error } = await supabase.from("user_roles").insert({ user_id: id, role: role as never });
        if (error) throw error;
      }
      if (role === "reporter") {
        const { error } = await supabase
          .from("staff_permissions" as never)
          .upsert({ user_id: id } as never, { onConflict: "user_id", ignoreDuplicates: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("भूमिका बदल दी गई");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setPerm = useMutation({
    mutationFn: async ({ id, perms }: { id: string; perms: ReporterPermissions }) => {
      const { data, error } = await supabase
        .from("staff_permissions" as never)
        .upsert({ user_id: id, ...perms, updated_at: new Date().toISOString() } as never)
        .select("user_id");
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0) throw new Error("सेव नहीं हुआ");
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const [filter, setFilter] = useState("");
  const list = (members ?? []).filter((m) => m.email.toLowerCase().includes(filter.toLowerCase()));

  return (
    <section className="rounded-md border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold">टीम और अनुमतियां</h2>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ईमेल खोजें"
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        रिपोर्टर को सिर्फ "खबरें" और "वीडियो" दिखते हैं, और वे केवल अपनी खबरें बदल सकते हैं। बाकी सब एडमिन के हाथ में रहता है।
      </p>
      {isLoading ? (
        <p className="mt-3 text-xs text-muted-foreground">लोड हो रहा है…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {list.map((m) => (
            <li key={m.id} className="rounded-md border border-border p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.email}</span>
                <select
                  value={m.role}
                  disabled={m.id === currentUserId || setRole.isPending}
                  onChange={(e) => setRole.mutate({ id: m.id, role: e.target.value })}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {m.role === "reporter" && (
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {PERMISSION_LABELS.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={m.perms[p.key]}
                        onChange={() => setPerm.mutate({ id: m.id, perms: { ...m.perms, [p.key]: !m.perms[p.key] } })}
                        className="h-4 w-4 accent-primary"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
