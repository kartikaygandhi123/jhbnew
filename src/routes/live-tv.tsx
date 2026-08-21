import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { useState } from "react";

import { LeftRail } from "@/components/Rails";
import { ThreePane } from "@/components/ThreePane";
import { RailItem, SectionHeading } from "@/components/news";
import { trendingNews } from "@/data/news";

type Channel = {
  id: string;
  name: string;
  youtubeId: string;
  tagline: string;
};

const channels: Channel[] = [
  {
    id: "jhb",
    name: "जय हिन्द भारत लाइव",
    youtubeId: "jfKfPfyJRdk",
    tagline: "24x7 हिंदी न्यूज लाइव स्ट्रीम",
  },
  {
    id: "sansad",
    name: "संसद लाइव",
    youtubeId: "hHW1oY26kxQ",
    tagline: "सदन की कार्यवाही सीधा प्रसारण",
  },
  {
    id: "bulletin",
    name: "सुपरफास्ट बुलेटिन",
    youtubeId: "0e3GPea1Tyg",
    tagline: "हर घंटे की बड़ी खबरें",
  },
];

export const Route = createFileRoute("/live-tv")({
  head: () => ({
    meta: [
      { title: "लाइव टीवी — जय हिन्द भारत 24x7 हिंदी न्यूज" },
      {
        name: "description",
        content:
          "जय हिन्द भारत लाइव टीवी — 24 घंटे हिंदी न्यूज लाइव स्ट्रीम, संसद की कार्यवाही और सुपरफास्ट बुलेटिन ऑनलाइन देखें।",
      },
      { property: "og:title", content: "लाइव टीवी — जय हिन्द भारत" },
      { property: "og:description", content: "24x7 हिंदी न्यूज लाइव स्ट्रीम ऑनलाइन देखें।" },
    ],
  }),
  component: LiveTv,
});

function LiveTv() {
  const [activeId, setActiveId] = useState(channels[0]!.id);
  const active = channels.find((c) => c.id === activeId)!;

  return (
    <ThreePane
      left={<LeftRail />}
      right={
        <section className="rounded-md border border-border bg-card p-3">
          <SectionHeading>ट्रेंडिंग</SectionHeading>
          <div className="space-y-3">
            {trendingNews.map((a) => (
              <RailItem key={a.id} article={a} />
            ))}
          </div>
        </section>
      }
    >
      <h1 className="section-rule headline mb-4 flex items-center gap-2 text-2xl font-bold">
        <span className="inline-flex items-center gap-1.5 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground" /> LIVE
        </span>
        लाइव टीवी
      </h1>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="relative aspect-video w-full bg-headline">
          <iframe
            key={active.youtubeId}
            src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1&mute=1&rel=0`}
            title={active.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <h2 className="headline text-lg font-bold">{active.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{active.tagline}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground">
            <Radio className="h-3 w-3 animate-pulse" /> ऑन एयर
          </span>
        </div>
      </div>

      <h2 className="section-rule headline mt-6 mb-3 text-xl font-bold">और चैनल</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setActiveId(c.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`group rounded-md border p-2 text-left transition-colors ${
              c.id === activeId ? "border-primary" : "border-border hover:bg-accent"
            }`}
          >
            <div className="relative">
              <img
                src={`https://i.ytimg.com/vi/${c.youtubeId}/mqdefault.jpg`}
                alt=""
                width={320}
                height={180}
                loading="lazy"
                decoding="async"
                className="aspect-video w-full rounded-sm object-cover"
              />
              <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                LIVE
              </span>
            </div>
            <p className="headline mt-2 text-sm font-semibold group-hover:text-primary">{c.name}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{c.tagline}</p>
          </button>
        ))}
      </div>
    </ThreePane>
  );
}
