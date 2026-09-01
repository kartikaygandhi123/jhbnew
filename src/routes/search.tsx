import { createFileRoute } from "@tanstack/react-router";

import { FeedCard, ListSkeleton, SectionHeading } from "@/components/news";
import { ThreePane } from "@/components/ThreePane";
import { useArticles } from "@/lib/content";

type SearchParams = { q: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search['q'] === "string" ? search['q'] : "",
  }),
  head: () => ({
    meta: [
      { title: "खोज परिणाम — जय हिन्द भारत" },
      { name: "description", content: "जय हिन्द भारत पर खबरों में खोजें — शीर्षक, सारांश और जगह के अनुसार।" },
      { property: "og:title", content: "खोज — जय हिन्द भारत" },
      { property: "og:description", content: "हिंदी खबरों में खोजें।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data: articles, isLoading } = useArticles();

  const term = q.trim().toLowerCase();
  const results = term
    ? (articles ?? []).filter((a) =>
        [a.title, a.summary, a.kicker, a.place, a.category_label, a.body ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : [];

  return (
    <ThreePane>
      <SectionHeading>खोज: {q || "—"}</SectionHeading>
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {term ? "कोई खबर नहीं मिली। दूसरा शब्द आज़माएं।" : "ऊपर सर्च बॉक्स में कीवर्ड लिखें।"}
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{results.length} परिणाम</p>
          {results.map((a) => (
            <FeedCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </ThreePane>
  );
}
