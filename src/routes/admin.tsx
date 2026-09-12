import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminTable, type FieldDef } from "@/components/admin/AdminTable";
import { supabase } from "@/integrations/supabase/client";
import { useEditions } from "@/lib/content";
import { deletePromo, listAllPromos, savePromo } from "@/lib/promos.functions";
import { useIsStaff, useSession } from "@/lib/useAuth";
import { uploadMedia } from "@/lib/upload";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "एडमिन पैनल — जय हिन्द भारत" },
      { name: "description", content: "जय हिन्द भारत का संपादकीय कंट्रोल पैनल — खबरें, वीडियो, ई-पेपर और सेटिंग्स।" },
      { property: "og:title", content: "एडमिन पैनल — जय हिन्द भारत" },
      { property: "og:description", content: "संपादकीय कंट्रोल पैनल।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { id: "articles", label: "खबरें" },
  { id: "categories", label: "श्रेणियां" },
  { id: "videos", label: "वीडियो" },
  { id: "live", label: "लाइव टीवी" },
  { id: "epaper", label: "ई-पेपर" },
  { id: "tags", label: "ट्रेंडिंग टैग" },
  { id: "ads", label: "विज्ञापन" },
  { id: "settings", label: "साइट सेटिंग्स" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const articleFields: FieldDef[] = [
  { name: "title", label: "शीर्षक", type: "text" },
  { name: "slug", label: "स्लग (URL)", type: "text", placeholder: "vikas-ki-rajniti" },
  { name: "kicker", label: "किकर", type: "text" },
  { name: "summary", label: "सारांश", type: "textarea" },
  { name: "body", label: "पूरी खबर (खाली लाइन से पैराग्राफ अलग करें)", type: "textarea" },
  { name: "category_slug", label: "श्रेणी", type: "category" },
  { name: "place", label: "स्थान", type: "text" },
  { name: "time_label", label: "समय टेक्स्ट", type: "text" },
  { name: "image_url", label: "मुख्य तस्वीर", type: "image" },
  {
    name: "section",
    label: "सेक्शन",
    type: "select",
    options: [
      { value: "big", label: "बड़ी खबरें" },
      { value: "desh", label: "देश और दुनिया" },
      { value: "feed", label: "आपके लिए (फीड)" },
      { value: "latest", label: "ताजा (बायां रेल)" },
      { value: "trending", label: "ट्रेंडिंग (दायां रेल)" },
    ],
  },
  {
    name: "tone",
    label: "कार्ड रंग",
    type: "select",
    options: [
      { value: "plain", label: "सादा" },
      { value: "saffron", label: "केसरिया" },
      { value: "green", label: "हरा" },
    ],
  },
  { name: "is_breaking", label: "ब्रेकिंग स्ट्रिप में दिखाएं", type: "boolean" },
  { name: "published", label: "प्रकाशित", type: "boolean" },
  { name: "sort_order", label: "क्रम", type: "number" },
];

function AdminPage() {
  const { user, loading } = useSession();
  const { data: isStaff, isLoading: roleLoading } = useIsStaff(user?.id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("articles");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || (user && roleLoading)) {
    return <p className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">लोड हो रहा है…</p>;
  }

  if (!user) return null;

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="headline text-xl font-bold">पहुंच नहीं है</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          इस खाते के पास संपादन अधिकार नहीं हैं। कृपया एडमिन से संपर्क करें।
        </p>
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          className="mt-4 rounded-md border border-border px-3 py-2 text-xs font-semibold"
        >
          साइन आउट
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="headline text-xl font-bold sm:text-2xl">न्यूज़रूम एडमिन पैनल</h1>
          <p className="text-[11px] text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent">
            साइट देखें
          </Link>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
          >
            <LogOut className="h-3.5 w-3.5" /> साइन आउट
          </button>
        </div>
      </div>

      <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
              tab === t.id ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-4 space-y-4">
        {tab === "articles" && (
          <AdminTable
            table="articles"
            title="खबरें"
            fields={articleFields}
            defaults={{ section: "feed", tone: "plain", published: true, sort_order: 100 }}
          />
        )}

        {tab === "categories" && (
          <AdminTable
            table="categories"
            title="श्रेणियां (मेन्यू)"
            fields={[
              { name: "label", label: "नाम", type: "text" },
              { name: "slug", label: "स्लग", type: "text" },
              { name: "sort_order", label: "क्रम", type: "number" },
            ]}
          />
        )}

        {tab === "videos" && (
          <AdminTable
            table="videos"
            title="वीडियो"
            fields={[
              { name: "title", label: "शीर्षक", type: "text" },
              { name: "youtube_id", label: "YouTube ID", type: "text", placeholder: "dQw4w9WgXcQ" },
              { name: "category", label: "श्रेणी", type: "text" },
              { name: "duration", label: "अवधि", type: "text" },
              { name: "time_label", label: "तारीख टेक्स्ट", type: "text" },
              { name: "published", label: "प्रकाशित", type: "boolean" },
              { name: "sort_order", label: "क्रम", type: "number" },
            ]}
            defaults={{ published: true, sort_order: 100 }}
          />
        )}

        {tab === "live" && (
          <AdminTable
            table="live_channels"
            title="लाइव टीवी चैनल"
            fields={[
              { name: "name", label: "चैनल नाम", type: "text" },
              { name: "youtube_id", label: "लाइव स्ट्रीम का YouTube ID", type: "text" },
              { name: "description", label: "विवरण", type: "textarea" },
              { name: "is_live", label: "लाइव है", type: "boolean" },
              { name: "sort_order", label: "क्रम", type: "number" },
            ]}
            defaults={{ is_live: true, sort_order: 100 }}
          />
        )}

        {tab === "epaper" && <EpaperAdmin />}

        {tab === "tags" && (
          <AdminTable
            table="trending_tags"
            title="ट्रेंडिंग टैग"
            fields={[
              { name: "label", label: "टैग", type: "text" },
              { name: "sort_order", label: "क्रम", type: "number" },
            ]}
          />
        )}

        {tab === "ads" && (
          <AdminTable
            table="ads"
            title="विज्ञापन"
            fields={[
              { name: "title", label: "पहचान नाम", type: "text" },
              {
                name: "placement",
                label: "जगह",
                type: "select",
                options: [
                  { value: "header-center", label: "हेडर — बीच" },
                  { value: "header-right", label: "हेडर — दायां कोना" },
                  { value: "top", label: "मुख्य पेज — ऊपर" },
                  { value: "in-feed", label: "खबरों के बीच" },
                  { value: "sidebar-left", label: "बायां साइडबार" },
                  { value: "sidebar-right", label: "दायां साइडबार" },
                  { value: "float-right", label: "हॉवरिंग — नीचे दायां" },
                  { value: "float-left", label: "हॉवरिंग — नीचे बायां" },
                ],
              },
              { name: "image_url", label: "विज्ञापन तस्वीर", type: "image" },
              { name: "link_url", label: "लिंक (वैकल्पिक)", type: "text", placeholder: "https://" },
              { name: "alt_text", label: "वैकल्पिक टेक्स्ट", type: "text" },
              { name: "width", label: "चौड़ाई (px)", type: "number" },
              { name: "height", label: "ऊंचाई (px)", type: "number" },
              { name: "dismissible", label: "बंद करने का बटन (हॉवरिंग)", type: "boolean" },
              { name: "active", label: "चालू", type: "boolean" },
              { name: "sort_order", label: "क्रम", type: "number" },
            ]}
            defaults={{
              placement: "header-center",
              width: 728,
              height: 90,
              dismissible: true,
              active: true,
              sort_order: 100,
            }}
            api={{
              list: () => listAllPromos() as Promise<Record<string, unknown>[]>,
              save: async (row) => {
                await savePromo({
                  data: {
                    ...(row['id'] ? { id: String(row['id']) } : {}),
                    placement: String(row['placement'] ?? "header-center"),
                    title: String(row['title'] ?? ""),
                    image_url: (row['image_url'] as string) || null,
                    link_url: String(row['link_url'] ?? ""),
                    alt_text: String(row['alt_text'] ?? ""),
                    width: Number(row['width'] ?? 728),
                    height: Number(row['height'] ?? 90),
                    dismissible: Boolean(row['dismissible']),
                    active: Boolean(row['active']),
                    sort_order: Number(row['sort_order'] ?? 100),
                  },
                });
              },
              remove: async (id) => {
                await deletePromo({ data: { id } });
              },
            }}
          />
        )}

        {tab === "settings" && <SettingsForm />}
      </div>
    </div>
  );
}

function EpaperAdmin() {
  const { data: editions } = useEditions();
  const [editionId, setEditionId] = useState<string | undefined>(undefined);
  const current = editions?.find((e) => e.id === editionId) ?? editions?.[0];
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const bulkUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !current) return;
    setBusy(true);
    try {
      const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      const { data: existing } = await supabase
        .from("epaper_pages")
        .select("page_no")
        .eq("edition_id", current.id)
        .order("page_no", { ascending: false })
        .limit(1);
      let next = (existing?.[0]?.page_no ?? 0) + 1;
      for (const file of sorted) {
        const url = await uploadMedia(file, `epaper/${current.id}`);
        const { error } = await supabase
          .from("epaper_pages")
          .insert({ edition_id: current.id, page_no: next, image_url: url });
        if (error) throw error;
        next += 1;
      }
      toast.success(`${String(sorted.length)} पेज जोड़े गए`);
      void qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "अपलोड विफल");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminTable
        table="epaper_editions"
        title="ई-पेपर संस्करण"
        fields={[
          { name: "city", label: "संस्करण / शहर", type: "text" },
          { name: "date_label", label: "तारीख", type: "text" },
          { name: "pdf_url", label: "पूरा PDF", type: "file" },
          { name: "is_current", label: "आज का संस्करण", type: "boolean" },
          { name: "sort_order", label: "क्रम", type: "number" },
        ]}
        defaults={{ is_current: false, sort_order: 100 }}
      />

      <section className="rounded-md border border-border bg-card p-3">
        <h2 className="headline text-base font-bold">पेज (तस्वीरें)</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={current?.id ?? ""}
            onChange={(e) => setEditionId(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            {(editions ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.city} — {e.date_label}
              </option>
            ))}
          </select>
          <label className="inline-flex h-9 cursor-pointer items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
            {busy ? "अपलोड हो रहा है…" : "कई पेज अपलोड करें"}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => void bulkUpload(e.target.files)}
            />
          </label>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          PDF के पेजों की तस्वीरें (JPG/PNG) क्रम में चुनें — फ़ाइल नाम के अनुसार पेज नंबर लगेंगे।
        </p>
      </section>

      {current && (
        <AdminTable
          key={current.id}
          table="epaper_pages"
          title={`पेज सूची — ${current.city}`}
          orderBy="page_no"
          filter={{ column: "edition_id", value: current.id }}
          fields={[
            { name: "page_no", label: "पेज नंबर", type: "number" },
            { name: "image_url", label: "पेज तस्वीर", type: "image" },
            { name: "thumb_url", label: "थंबनेल (वैकल्पिक)", type: "image" },
          ]}
        />
      )}
    </div>
  );
}

function SettingsForm() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const value: Record<string, unknown> | null = form ?? (data as Record<string, unknown> | null | undefined) ?? null;

  const save = useMutation({
    mutationFn: async () => {
      if (!value) return;
      const { error } = await supabase
        .from("site_settings")
        .update({
          site_name: String(value['site_name'] ?? ""),
          logo_url: (value['logo_url'] as string) || null,
          breaking_label: String(value['breaking_label'] ?? ""),
          ticker_seconds: Number(value['ticker_seconds'] ?? 40),
          lead_kicker: String(value['lead_kicker'] ?? ""),
          lead_title: String(value['lead_title'] ?? ""),
          footer_text: String(value['footer_text'] ?? ""),
          contact_email: String(value['contact_email'] ?? ""),
          contact_phone: String(value['contact_phone'] ?? ""),
        })
        .eq("id", "main");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("सेटिंग्स सेव हो गईं");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!value) return <p className="text-xs text-muted-foreground">लोड हो रहा है…</p>;

  const set = (k: string, v: unknown) => setForm({ ...value, [k]: v });

  const text = (k: string, label: string) => (
    <label className="block text-xs">
      <span className="mb-1 block font-semibold text-muted-foreground">{label}</span>
      <input
        value={String(value[k] ?? "")}
        onChange={(e) => set(k, e.target.value)}
        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
      />
    </label>
  );

  return (
    <section className="grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-2">
      {text("site_name", "साइट का नाम")}
      <label className="block text-xs">
        <span className="mb-1 block font-semibold text-muted-foreground">लोगो</span>
        <span className="flex items-center gap-2">
          <input
            value={String(value['logo_url'] ?? "")}
            onChange={(e) => set("logo_url", e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          />
          <label className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-md border border-border px-2 text-xs font-semibold hover:bg-accent">
            अपलोड
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void uploadMedia(file, "branding").then(
                  (url) => set("logo_url", url),
                  () => toast.error("अपलोड विफल"),
                );
              }}
            />
          </label>
        </span>
      </label>
      {text("breaking_label", "ब्रेकिंग लेबल")}
      <label className="block text-xs">
        <span className="mb-1 block font-semibold text-muted-foreground">टिकर स्पीड (सेकंड)</span>
        <input
          type="number"
          value={Number(value['ticker_seconds'] ?? 40)}
          onChange={(e) => set("ticker_seconds", Number(e.target.value))}
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
        />
      </label>
      {text("lead_kicker", "होम पेज किकर")}
      {text("lead_title", "होम पेज मुख्य शीर्षक")}
      {text("contact_email", "संपर्क ईमेल")}
      {text("contact_phone", "संपर्क फोन")}
      <label className="block text-xs sm:col-span-2">
        <span className="mb-1 block font-semibold text-muted-foreground">फुटर टेक्स्ट</span>
        <textarea
          rows={3}
          value={String(value['footer_text'] ?? "")}
          onChange={(e) => set("footer_text", e.target.value)}
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          सेव करें
        </button>
      </div>
    </section>
  );
}
