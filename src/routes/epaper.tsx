import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { EpaperPage } from "@/components/EpaperPage";
import { SectionHeading } from "@/components/news";
import { editions } from "@/data/news";

export const Route = createFileRoute("/epaper")({
  head: () => ({
    meta: [
      { title: "ई-पेपर — जय हिन्द भारत हिंदी दैनिक" },
      {
        name: "description",
        content:
          "जय हिन्द भारत का आज का ई-पेपर पढ़ें — दिल्ली, लखनऊ, पटना, जयपुर, भोपाल और देहरादून संस्करण, पेज दर पेज।",
      },
      { property: "og:title", content: "ई-पेपर — जय हिन्द भारत" },
      { property: "og:description", content: "आज का हिंदी ई-पेपर, सभी शहर संस्करण एक जगह।" },
    ],
  }),
  component: Epaper,
});

function Epaper() {
  const [editionId, setEditionId] = useState(editions[0]!.id);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const edition = editions.find((e) => e.id === editionId)!;
  const clampPage = Math.min(page, edition.pages);

  const goto = (next: number) => {
    setPage(Math.min(Math.max(next, 1), edition.pages));
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
      <aside className="order-2 lg:order-1">
        <div className="rail-scroll space-y-4 lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)]">
          <section className="rounded-md border border-border bg-card p-3">
            <SectionHeading>संस्करण चुनें</SectionHeading>
            <div className="grid gap-2">
              {editions.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    setEditionId(e.id);
                    setPage(1);
                  }}
                  className={`rounded-md border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    e.id === editionId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {e.city}
                  <span className="block text-[11px] font-normal opacity-80">
                    {e.date} • {e.pages} पेज
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>

      <main className="order-1 min-w-0 lg:order-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
          <div className="min-w-0">
            <h1 className="headline truncate text-lg font-bold sm:text-xl">
              ई-पेपर — {edition.city} संस्करण
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {edition.date} • पेज {clampPage}/{edition.pages}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="ज़ूम आउट"
              onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              aria-label="ज़ूम इन"
              onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="पिछला पेज"
              onClick={() => goto(clampPage - 1)}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="अगला पेज"
              onClick={() => goto(clampPage + 1)}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-md border border-border bg-surface p-3">
          <div
            className="mx-auto origin-top transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
          >
            <EpaperPage city={edition.city} date={edition.date} page={clampPage} />
          </div>
        </div>
      </main>

      <aside className="order-3">
        <div className="rail-scroll lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)]">
          <section className="rounded-md border border-border bg-card p-3">
            <SectionHeading>पेज</SectionHeading>
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-3">
              {Array.from({ length: edition.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goto(p)}
                  className={`rounded-md border px-0 py-2 text-xs font-semibold transition-colors ${
                    p === clampPage
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
