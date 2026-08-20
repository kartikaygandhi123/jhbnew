import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useState } from "react";

import { LeftRail } from "@/components/Rails";
import { ThreePane } from "@/components/ThreePane";
import { RailItem, SectionHeading } from "@/components/news";
import { trendingNews, videos } from "@/data/news";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "वीडियो — जय हिन्द भारत की खबरें वीडियो में" },
      {
        name: "description",
        content:
          "जय हिन्द भारत के लेटेस्ट न्यूज वीडियो, ग्राउंड रिपोर्ट और एक्सप्लेनर — सीधे वेबसाइट पर देखें।",
      },
      { property: "og:title", content: "वीडियो — जय हिन्द भारत" },
      { property: "og:description", content: "न्यूज वीडियो, ग्राउंड रिपोर्ट और एक्सप्लेनर एक जगह।" },
    ],
  }),
  component: Videos,
});

function Videos() {
  const [activeId, setActiveId] = useState(videos[0]!.id);
  const [playing, setPlaying] = useState(false);

  const active = videos.find((v) => v.id === activeId)!;

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
      <h1 className="section-rule headline mb-4 text-2xl font-bold">वीडियो</h1>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="relative aspect-video w-full bg-headline">
          {playing ? (
            <iframe
              key={active.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1&rel=0`}
              title={active.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 h-full w-full"
              aria-label={`चलाएं: ${active.title}`}
            >
              <img
                src={`https://i.ytimg.com/vi/${active.youtubeId}/hqdefault.jpg`}
                alt=""
                width={480}
                height={270}
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                  <Play className="h-7 w-7" />
                </span>
              </span>
            </button>
          )}
        </div>
        <div className="p-3">
          <h2 className="headline text-lg font-bold">{active.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {active.category} • {active.duration} • {active.time}
          </p>
        </div>
      </div>

      <h2 className="section-rule headline mt-6 mb-3 text-xl font-bold">और वीडियो</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setActiveId(v.id);
              setPlaying(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`group rounded-md border p-2 text-left transition-colors ${
              v.id === activeId ? "border-primary" : "border-border hover:bg-accent"
            }`}
          >
            <div className="relative">
              <img
                src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}
                alt=""
                width={320}
                height={180}
                loading="lazy"
                decoding="async"
                className="aspect-video w-full rounded-sm object-cover"
              />
              <span className="absolute right-1 bottom-1 rounded bg-headline/85 px-1.5 py-0.5 text-[10px] text-primary-foreground">
                {v.duration}
              </span>
            </div>
            <p className="headline mt-2 text-sm font-semibold group-hover:text-primary">{v.title}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {v.category} • {v.time}
            </p>
          </button>
        ))}
      </div>
    </ThreePane>
  );
}
