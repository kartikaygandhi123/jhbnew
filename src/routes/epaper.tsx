import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "@/components/news";
import pdfAsset from "@/assets/epaper-18-aug.pdf.asset.json";

const EPAPER = {
  city: "मुख्य संस्करण",
  date: "18 अगस्त 2026",
  pages: 8,
  url: pdfAsset.url,
};

export const Route = createFileRoute("/epaper")({
  head: () => ({
    meta: [
      { title: "ई-पेपर — जय हिन्द भारत हिंदी दैनिक" },
      {
        name: "description",
        content:
          "जय हिन्द भारत का आज का ई-पेपर पढ़ें — पूरा अखबार पेज दर पेज, ऑनलाइन और डाउनलोड के लिए उपलब्ध।",
      },
      { property: "og:title", content: "ई-पेपर — जय हिन्द भारत" },
      { property: "og:description", content: "आज का हिंदी ई-पेपर पेज दर पेज पढ़ें।" },
    ],
  }),
  component: Epaper,
});

function Epaper() {
  const [page, setPage] = useState(1);

  const goto = (next: number) => {
    setPage(Math.min(Math.max(next, 1), EPAPER.pages));
  };

  const src = `${EPAPER.url}#page=${page}&view=FitH&toolbar=1`;

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_240px]">
      <main className="order-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
          <div className="min-w-0">
            <h1 className="headline truncate text-lg font-bold sm:text-xl">
              ई-पेपर — {EPAPER.city}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {EPAPER.date} • पेज {page}/{EPAPER.pages}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={EPAPER.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              <ExternalLink className="h-3.5 w-3.5" /> नई विंडो
            </a>
            <a
              href={EPAPER.url}
              download
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" /> डाउनलोड
            </a>
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

        <div className="mt-4 rounded-md border border-border bg-surface p-2">
          <iframe
            key={page}
            src={src}
            title={`ई-पेपर पेज ${page}`}
            className="h-[80vh] min-h-[520px] w-full rounded-sm bg-card"
          />
        </div>
      </main>

      <aside className="order-2">
        <div className="rail-scroll lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)]">
          <section className="rounded-md border border-border bg-card p-3">
            <SectionHeading>पेज</SectionHeading>
            <div className="grid grid-cols-6 gap-2 lg:grid-cols-4">
              {Array.from({ length: EPAPER.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goto(p)}
                  className={`rounded-md border px-0 py-2 text-xs font-semibold transition-colors ${
                    p === page
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
