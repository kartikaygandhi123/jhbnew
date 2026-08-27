import { createFileRoute } from "@tanstack/react-router";

import { FeedCard, ListSkeleton, SectionHeading } from "@/components/news";
import { ThreePane } from "@/components/ThreePane";
import { useArticles, useCategories } from "@/lib/content";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} की ताजा खबरें — जय हिन्द भारत` },
      {
        name: "description",
        content: `जय हिन्द भारत पर ${params.slug} श्रेणी की ताजा हिंदी खबरें, रिपोर्ट और अपडेट पढ़ें।`,
      },
      { property: "og:title", content: `${params.slug} — जय हिन्द भारत` },
      { property: "og:description", content: "श्रेणीवार ताजा हिंदी खबरें।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: articles, isLoading } = useArticles();
  const { data: categories } = useCategories();

  const label = categories?.find((c) => c.slug === slug)?.label ?? slug;
  const list = (articles ?? []).filter((a) => a.category_slug === slug);

  return (
    <ThreePane>
      <SectionHeading>{label}</SectionHeading>
      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">इस श्रेणी में अभी कोई खबर नहीं है।</p>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <FeedCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </ThreePane>
  );
}
