import { createFileRoute, Link } from "@tanstack/react-router";

import { LeftRail, RightRail } from "@/components/Rails";
import { ThreePane } from "@/components/ThreePane";
import { FeedCard, SectionHeading, TileCard } from "@/components/news";
import { bigNews, deshNews, feedNews, leadStory, videos } from "@/data/news";
import market from "@/assets/news-market.jpg";
import metro from "@/assets/news-metro.jpg";
import monsoon from "@/assets/news-monsoon.jpg";
import parliament from "@/assets/news-parliament.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "जय हिन्द भारत — हिंदी समाचार, ई-पेपर और वीडियो" },
      {
        name: "description",
        content:
          "देश, राज्य, कारोबार, खेल और मनोरंजन की ताजा हिंदी खबरें, दैनिक ई-पेपर और लेटेस्ट वीडियो एक ही जगह।",
      },
      { property: "og:title", content: "जय हिन्द भारत — हिंदी समाचार, ई-पेपर और वीडियो" },
      {
        property: "og:description",
        content: "देश, राज्य, कारोबार, खेल और मनोरंजन की ताजा हिंदी खबरें, दैनिक ई-पेपर और लेटेस्ट वीडियो एक ही जगह।",
      },
    ],
  }),
  component: Home,
});

const tileImages = [parliament, metro, monsoon];
const feedImages = [market, parliament, metro, monsoon, market, metro];

function Home() {
  return (
    <>
      <div className="mx-auto max-w-[1400px] px-4 pt-5 text-center">
        <span className="inline-block bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          {leadStory.kicker}
        </span>
        <h1 className="headline mx-auto mt-3 max-w-4xl text-2xl font-bold sm:text-3xl lg:text-4xl">
          {leadStory.title}
        </h1>
      </div>

      <ThreePane left={<LeftRail />} right={<RightRail />}>
        <div className="grid gap-5 md:grid-cols-2">
          <section>
            <SectionHeading>बड़ी खबरें</SectionHeading>
            <div className="space-y-3">
              {bigNews.map((a, i) => (
                <TileCard key={a.id} article={a} {...(tileImages[i] ? { image: tileImages[i] } : {})} />
              ))}
            </div>
          </section>
          <section>
            <SectionHeading>देश</SectionHeading>
            <div className="space-y-3">
              {deshNews.map((a, i) => (
                <TileCard
                  key={a.id}
                  article={a}
                  {...(tileImages[2 - i] ? { image: tileImages[2 - i] } : {})}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6">
          <SectionHeading>आज की सुर्खियां</SectionHeading>
          <div className="space-y-4">
            {feedNews.map((a, i) => (
              <FeedCard key={a.id} article={a} {...(feedImages[i] ? { image: feedImages[i] } : {})} />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <SectionHeading>लेटेस्ट वीडियो</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {videos.slice(0, 4).map((v) => (
              <Link key={v.id} to="/videos" className="group block rounded-md border border-border bg-card p-2">
                <img
                  src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                  alt=""
                  width={480}
                  height={270}
                  loading="lazy"
                  decoding="async"
                  className="aspect-video w-full rounded-sm object-cover"
                />
                <p className="headline mt-2 text-sm font-semibold group-hover:text-primary">{v.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {v.category} • {v.duration}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </ThreePane>
    </>
  );
}
