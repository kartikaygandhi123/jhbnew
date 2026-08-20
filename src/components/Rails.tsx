import { Link } from "@tanstack/react-router";
import { Newspaper, PlayCircle } from "lucide-react";

import { RailItem, SectionHeading } from "@/components/news";
import { latestNews, trendingNews, videos } from "@/data/news";
import horoscope from "@/assets/news-parliament.jpg";

export function LeftRail() {
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-border bg-card p-3">
        <SectionHeading>ताजा खबरें</SectionHeading>
        <div className="space-y-3">
          {latestNews.map((a) => (
            <RailItem key={a.id} article={a} />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-4 text-center">
        <p className="headline text-lg font-bold">जय हिन्द भारत</p>
        <p className="mt-1 text-[11px] text-muted-foreground">निष्पक्ष • निर्भीक • निरंतर</p>
        <Link
          to="/epaper"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Newspaper className="h-4 w-4" /> आज का ई-पेपर पढ़ें
        </Link>
        <Link
          to="/videos"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-accent"
        >
          <PlayCircle className="h-4 w-4" /> लेटेस्ट वीडियो
        </Link>
      </section>
    </div>
  );
}

export function RightRail() {
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-border bg-card p-3">
        <SectionHeading>ट्रेंडिंग</SectionHeading>
        <div className="space-y-3">
          {trendingNews.map((a, i) => (
            <RailItem key={a.id} article={a} {...(i === 0 ? { thumb: horoscope } : {})} />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-3">
        <SectionHeading>वीडियो</SectionHeading>
        <div className="space-y-3">
          {videos.slice(0, 3).map((v) => (
            <Link key={v.id} to="/videos" className="block">
              <img
                src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}
                alt=""
                width={320}
                height={180}
                loading="lazy"
                decoding="async"
                className="aspect-video w-full rounded-sm object-cover"
              />
              <p className="headline mt-1 text-[13px] font-semibold">{v.title}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
