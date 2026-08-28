import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Download, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { SectionHeading } from "@/components/news";
import { useEditionPages, useEditions } from "@/lib/content";

export const Route = createFileRoute("/epaper")({
  head: () => ({
    meta: [
      { title: "ई-पेपर — जय हिन्द भारत हिंदी दैनिक" },
      {
        name: "description",
        content:
          "जय हिन्द भारत का ई-पेपर पढ़ें — आज का पूरा अखबार पेज दर पेज, ऑनलाइन पढ़ें या PDF डाउनलोड करें।",
      },
      { property: "og:title", content: "ई-पेपर — जय हिन्द भारत" },
      { property: "og:description", content: "आज का हिंदी ई-पेपर पेज दर पेज पढ़ें।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Epaper,
});

function Epaper() {
  const { data: editions } = useEditions();
  const [editionId, setEditionId] = useState<string | undefined>(undefined);
  const current = editions?.find((e) => e.id === editionId) ?? editions?.[0];
  const { data: pages } = useEditionPages(current?.id);

  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setPage(1);
    setZoom(1);
  }, [current?.id]);

  const total = pages?.length ?? 0;
  const goto = (next: number) => {
    if (total === 0) return;
    setPage(Math.min(Math.max(next, 1), total));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const active = pages?.[page - 1];

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_200px]">
      <main className="order-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
          <div className="min-w-0">
            <h1 className="headline truncate text-lg font-bold sm:text-xl">
              ई-पेपर — {current?.city ?? "—"}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {current?.date_label} • पेज {page}/{total || "—"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {editions && editions.length > 1 && (
              <select
                value={current?.id ?? ""}
                onChange={(e) => setEditionId(e.target.value)}
                className="h-8 rounded-md border border-border bg-card px-2 text-xs"
              >
                {editions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.city} — {e.date_label}
                  </option>
                ))}
              </select>
            )}
            {current?.pdf_url ? (
              <a
                href={current.pdf_url}
                download
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" /> PDF
              </a>
            ) : null}
            <button
              type="button"
              aria-label="ज़ूम आउट"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              aria-label="ज़ूम इन"
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="पिछला पेज"
              onClick={() => goto(page - 1)}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="अगला पेज"
              onClick={() => goto(page + 1)}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-auto rounded-md border border-border bg-surface p-3">
          {active ? (
            <img
              key={active.id}
              src={active.image_url}
              alt={`जय हिन्द भारत ई-पेपर, ${current?.date_label ?? ""}, पेज ${page}`}
              className="mx-auto block h-auto rounded-sm bg-card shadow-sm"
              style={{ width: `${String(100 * zoom)}%`, maxWidth: zoom === 1 ? "100%" : "none" }}
            />
          ) : (
            <div className="aspect-[3/4] w-full animate-pulse rounded-sm bg-muted" />
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => goto(page - 1)}
            disabled={page === 1}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            पिछला पेज
          </button>
          <button
            type="button"
            onClick={() => goto(page + 1)}
            disabled={page >= total}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            अगला पेज
          </button>
        </div>
      </main>

      <aside className="order-2">
        <div className="no-scrollbar lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
          <section className="rounded-md border border-border bg-card p-3">
            <SectionHeading>पेज</SectionHeading>
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
              {(pages ?? []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goto(p.page_no)}
                  className={`overflow-hidden rounded-sm border transition-colors ${
                    p.page_no === page ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img
                    src={p.thumb_url ?? p.image_url}
                    alt={`पेज ${p.page_no}`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/4] w-full object-cover object-top"
                  />
                  <span className="block bg-surface py-0.5 text-center text-[10px] font-semibold">
                    {p.page_no}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
