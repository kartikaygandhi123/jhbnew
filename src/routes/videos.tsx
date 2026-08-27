import { createFileRoute } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "@/components/news";
import { useVideos } from "@/lib/content";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "वीडियो — जय हिन्द भारत" },
      {
        name: "description",
        content: "जय हिन्द भारत के ताजा न्यूज वीडियो, ग्राउंड रिपोर्ट, बहस और एक्सप्लेनर एक ही जगह देखें।",
      },
      { property: "og:title", content: "वीडियो — जय हिन्द भारत" },
      { property: "og:description", content: "ताजा हिंदी न्यूज वीडियो और रिपोर्ट।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const { data: videos } = useVideos();
  const [activeId, setActiveId] = useState<string | null>(null);

  const list = videos ?? [];
  const active = list.find((v) => v.id === activeId) ?? list[0];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5">
      <SectionHeading>वीडियो</SectionHeading>

      {active ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
              <iframe
                key={active.id}
                src={`https://www.youtube-nocookie.com/embed/${active.youtube_id}`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="h-full w-full"
              />
            </div>
            <h1 className="headline mt-3 text-lg font-bold sm:text-xl">{active.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {active.category} • {active.time_label}
            </p>
          </div>

          <aside className="space-y-3">
            {list.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveId(v.id)}
                className={`flex w-full gap-3 rounded-md border p-2 text-left transition-colors ${
                  v.id === active.id ? "border-primary bg-accent" : "border-border hover:bg-accent"
                }`}
              >
                <span className="relative shrink-0">
                  <img
                    src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`}
                    alt=""
                    width={320}
                    height={180}
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-28 rounded-sm object-cover"
                  />
                  <PlayCircle className="absolute inset-0 m-auto h-6 w-6 text-white/90" />
                </span>
                <span className="min-w-0">
                  <span className="headline line-clamp-2 block text-[13px] font-semibold">{v.title}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {v.duration} • {v.time_label}
                  </span>
                </span>
              </button>
            ))}
          </aside>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">अभी कोई वीडियो उपलब्ध नहीं है।</p>
      )}
    </div>
  );
}
