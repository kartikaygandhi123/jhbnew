import { Link } from "@tanstack/react-router";
import { Newspaper, PlayCircle, Radio } from "lucide-react";

import { ListSkeleton, RailItem, SectionHeading } from "@/components/news";
import { bySection, useArticles, useSiteSettings, useVideos } from "@/lib/content";
import { recentArticles } from "@/lib/news-rules";

export function LeftRail() {
  const { data: articles, isLoading } = useArticles();
  const { data: settings } = useSiteSettings();
  const latest = recentArticles(articles ?? []);

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-border bg-card p-3">
        <SectionHeading>ताजा खबरें</SectionHeading>
        {isLoading ? (
          <ListSkeleton />
        ) : (
          <div className="space-y-3">
            {latest.map((a) => (
              <RailItem key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border border-border bg-card p-4 text-center">
        <p className="headline text-lg font-bold">{settings?.site_name ?? "जय हिन्द भारत"}</p>
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
        <Link
          to="/live-tv"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Radio className="h-4 w-4" /> लाइव टीवी देखें
        </Link>
      </section>
    </div>
  );
}

export function TrendingRail() {
  const { data: articles, isLoading } = useArticles();
  const trending = bySection(articles, "trending");

  return (
    <section className="rounded-md border border-border bg-card p-3">
      <SectionHeading>ट्रेंडिंग</SectionHeading>
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-3">
          {trending.map((a, i) => (
            <RailItem key={a.id} article={a} withThumb={i === 0} />
          ))}
        </div>
      )}
    </section>
  );
}

export function RightRail() {
  const { data: videos } = useVideos();

  return (
    <div className="space-y-4">
      <TrendingRail />

      <section className="rounded-md border border-border bg-card p-3">
        <SectionHeading>वीडियो</SectionHeading>
        <div className="space-y-3">
          {(videos ?? []).slice(0, 3).map((v) => (
            <Link key={v.id} to="/videos" className="block">
              <img
                src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`}
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
