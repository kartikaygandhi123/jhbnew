import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "@/components/news";
import { useLiveChannels } from "@/lib/content";

export const Route = createFileRoute("/live-tv")({
  head: () => ({
    meta: [
      { title: "लाइव टीवी — जय हिन्द भारत 24x7 हिंदी न्यूज" },
      {
        name: "description",
        content: "जय हिन्द भारत लाइव टीवी — 24 घंटे हिंदी समाचार, ब्रेकिंग न्यूज और लाइव बहस सीधे देखें।",
      },
      { property: "og:title", content: "लाइव टीवी — जय हिन्द भारत" },
      { property: "og:description", content: "24x7 हिंदी न्यूज लाइव स्ट्रीम।" },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveTv,
});

function LiveTv() {
  const { data: channels } = useLiveChannels();
  const [activeId, setActiveId] = useState<string | null>(null);

  const list = channels ?? [];
  const active = list.find((c) => c.id === activeId) ?? list[0];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5">
      <SectionHeading>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            <Radio className="h-3 w-3 animate-pulse" /> LIVE
          </span>
          लाइव टीवी
        </span>
      </SectionHeading>

      {active ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
              <iframe
                key={active.id}
                src={`https://www.youtube-nocookie.com/embed/${active.youtube_id}?autoplay=1&mute=1`}
                title={active.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <h1 className="headline mt-3 text-lg font-bold sm:text-xl">{active.name}</h1>
            {active.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
            ) : null}
          </div>

          <aside className="space-y-2">
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors ${
                  c.id === active.id ? "border-primary bg-accent" : "border-border hover:bg-accent"
                }`}
              >
                <img
                  src={`https://i.ytimg.com/vi/${c.youtube_id}/mqdefault.jpg`}
                  alt=""
                  width={320}
                  height={180}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-24 shrink-0 rounded-sm object-cover"
                />
                <span className="min-w-0">
                  <span className="headline block text-[13px] font-semibold">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground">लाइव स्ट्रीम</span>
                </span>
              </button>
            ))}
          </aside>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">कोई लाइव चैनल कॉन्फ़िगर नहीं है।</p>
      )}
    </div>
  );
}
