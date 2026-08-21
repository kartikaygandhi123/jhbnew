import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Download, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "@/components/news";
import pdfAsset from "@/assets/epaper-18-aug.pdf.asset.json";
import p1 from "@/assets/epaper/p1.jpg.asset.json";
import p2 from "@/assets/epaper/p2.jpg.asset.json";
import p3 from "@/assets/epaper/p3.jpg.asset.json";
import p4 from "@/assets/epaper/p4.jpg.asset.json";
import p5 from "@/assets/epaper/p5.jpg.asset.json";
import p6 from "@/assets/epaper/p6.jpg.asset.json";
import p7 from "@/assets/epaper/p7.jpg.asset.json";
import p8 from "@/assets/epaper/p8.jpg.asset.json";

const pages = [p1, p2, p3, p4, p5, p6, p7, p8].map((a) => a.url);
const EDITION = { city: "मुख्य संस्करण", date: "18 अगस्त 2026" };

export const Route = createFileRoute("/epaper")({
  head: () => ({
    meta: [
      { title: "ई-पेपर — जय हिन्द भारत हिंदी दैनिक" },
      {
        name: "description",
        content:
          "जय हिन्द भारत का ई-पेपर पढ़ें — 18 अगस्त का पूरा अखबार पेज दर पेज, ऑनलाइन पढ़ें या PDF डाउनलोड करें।",
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
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const goto = (next: number) => {
    setPage(Math.min(Math.max(next, 1), pages.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_220px]">
      <main className="order-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
          <div className="min-w-0">
            <h1 className="headline truncate text-lg font-bold sm:text-xl">
              ई-पेपर — {EDITION.city}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {EDITION.date} • पेज {page}/{pages.length}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={pdfAsset.url}
              download
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </a>
            <button
              type="button"
              aria-label="ज़ूम आउट"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-accent"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              aria-label="ज़ूम इन"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
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
          <img
            src={pages[page - 1]}
            alt={`जय हिन्द भारत ई-पेपर, ${EDITION.date}, पेज ${page}`}
            className="mx-auto block h-auto rounded-sm bg-card shadow-sm"
            style={{ width: `${100 * zoom}%`, maxWidth: zoom === 1 ? "100%" : "none" }}
          />
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
            disabled={page === pages.length}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            अगला पेज
          </button>
        </div>
      </main>

      <aside className="order-2">
        <div className="rail-scroll no-scrollbar lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)]">
          <section className="rounded-md border border-border bg-card p-3">
            <SectionHeading>पेज</SectionHeading>
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
              {pages.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => goto(i + 1)}
                  className={`overflow-hidden rounded-sm border transition-colors ${
                    i + 1 === page ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img
                    src={src}
                    alt={`पेज ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/4] w-full object-cover object-top"
                  />
                  <span className="block bg-surface py-0.5 text-center text-[10px] font-semibold">
                    {i + 1}
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
