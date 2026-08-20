import { createFileRoute, notFound } from "@tanstack/react-router";

import { LeftRail, RightRail } from "@/components/Rails";
import { ThreePane } from "@/components/ThreePane";
import { FeedCard } from "@/components/news";
import { bigNews, categories, deshNews, feedNews } from "@/data/news";
import market from "@/assets/news-market.jpg";
import metro from "@/assets/news-metro.jpg";
import monsoon from "@/assets/news-monsoon.jpg";
import parliament from "@/assets/news-parliament.jpg";

const images = [parliament, metro, monsoon, market];

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = categories.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "श्रेणी नहीं मिली — जय हिन्द भारत" }, { name: "robots", content: "noindex" }] };
    }
    const label = loaderData.category.label;
    return {
      meta: [
        { title: `${label} की ताजा खबरें — जय हिन्द भारत` },
        { name: "description", content: `${label} से जुड़ी ताजा हिंदी खबरें, रिपोर्ट और अपडेट।` },
        { property: "og:title", content: `${label} की ताजा खबरें — जय हिन्द भारत` },
        { property: "og:description", content: `${label} की ताजा हिंदी खबरें और अपडेट।` },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const all = [...bigNews, ...deshNews, ...feedNews];
  const items = all.filter((a) => a.categorySlug === category.slug);
  const list = items.length > 0 ? items : all.slice(0, 4);

  return (
    <ThreePane left={<LeftRail />} right={<RightRail />}>
      <h1 className="section-rule headline mb-4 text-2xl font-bold">{category.label}</h1>
      <div className="space-y-4">
        {list.map((a, i) => (
          <FeedCard key={a.id} article={a} {...(images[i % images.length] ? { image: images[i % images.length]! } : {})} />
        ))}
      </div>
    </ThreePane>
  );
}
