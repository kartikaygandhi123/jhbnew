import { createFileRoute, Link } from "@tanstack/react-router";

import { FeedCard, ListSkeleton, SectionHeading, TileCard } from "@/components/news";
import { ThreePane } from "@/components/ThreePane";
import { bySection, useArticles, useSiteSettings, useTrendingTags } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "जय हिन्द भारत — ताजा हिंदी समाचार, ई-पेपर और लाइव टीवी" },
      {
        name: "description",
        content:
          "देश, राज्य, दुनिया, कारोबार, खेल और मनोरंजन की ताजा हिंदी खबरें, आज का ई-पेपर, वीडियो और 24x7 लाइव टीवी — जय हिन्द भारत पर।",
      },
      { property: "og:title", content: "जय हिन्द भारत — ताजा हिंदी समाचार" },
      {
        property: "og:description",
        content: "ताजा हिंदी खबरें, ई-पेपर, वीडियो और लाइव टीवी एक ही जगह।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: articles, isLoading } = useArticles();
  const { data: tags } = useTrendingTags();
  const { data: settings } = useSiteSettings();

  const big = bySection(articles, "big");
  const desh = bySection(articles, "desh");
  const feed = bySection(articles, "feed");
  const lead = big[0];

  return (
    <ThreePane>
      <div className="space-y-6">
        <section>
          <p className="text-xs font-semibold text-primary">
            {settings?.lead_kicker ?? "आज के अहम घटनाक्रम"}
          </p>
          <h1 className="headline mt-1 text-2xl leading-snug font-bold sm:text-3xl">
            {lead ? (
              <Link to="/article/$id" params={{ id: lead.slug || lead.id }} className="hover:text-primary">
                {settings?.lead_title ?? lead.title}
              </Link>
            ) : (
              (settings?.lead_title ?? "जय हिन्द भारत")
            )}
          </h1>
          {tags && tags.length > 0 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {tags.map((t) => (
                <Link
                  key={t.id}
                  to="/search"
                  search={{ q: t.label }}
                  className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold whitespace-nowrap hover:border-primary hover:text-primary"
                >
                  #{t.label}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading>बड़ी खबरें</SectionHeading>
          {isLoading ? (
            <ListSkeleton />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {big.map((a) => (
                <TileCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading>देश और दुनिया</SectionHeading>
          {isLoading ? (
            <ListSkeleton />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {desh.map((a) => (
                <TileCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading>आपके लिए</SectionHeading>
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : (
            <div className="space-y-3">
              {feed.map((a) => (
                <FeedCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </ThreePane>
  );
}
