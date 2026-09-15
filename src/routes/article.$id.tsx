import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";

import { RailItem, SectionHeading } from "@/components/news";
import { ShareBar } from "@/components/ShareBar";
import { ThreePane } from "@/components/ThreePane";
import { articleParagraphs, useArticles } from "@/lib/content";
import { getPublicArticle } from "@/lib/public-content.functions";

export const Route = createFileRoute("/article/$id")({
  loader: async ({ params }) => {
    const article = await getPublicArticle({ data: { key: params.id } });
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "खबर उपलब्ध नहीं — जय हिन्द भारत" }, { name: "robots", content: "noindex" }] };
    }
    const a = loaderData.article;
    const desc = (a.summary || a.title).slice(0, 155);
    return {
      meta: [
        { title: `${a.title.slice(0, 60)} — जय हिन्द भारत` },
        { name: "description", content: desc },
        { property: "og:title", content: a.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(a.image_url
          ? [
              {
                property: "og:image",
                content: a.image_url.startsWith("https://")
                  ? a.image_url
                  : `https://jaihindbharat.com${a.image_url.startsWith("/") ? "" : "/"}${a.image_url}`,
              },
              {
                name: "twitter:image",
                content: a.image_url.startsWith("https://")
                  ? a.image_url
                  : `https://jaihindbharat.com${a.image_url.startsWith("/") ? "" : "/"}${a.image_url}`,
              },
            ]
          : []),
      ],
    };
  },
  errorComponent: () => (
    <ThreePane>
      <p className="text-sm text-muted-foreground">खबर लोड नहीं हो सकी। कृपया दोबारा कोशिश करें।</p>
    </ThreePane>
  ),
  notFoundComponent: () => (
    <ThreePane>
      <SectionHeading>खबर नहीं मिली</SectionHeading>
      <Link to="/" className="text-sm font-semibold text-primary">
        होम पेज पर लौटें
      </Link>
    </ThreePane>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const { data: all } = useArticles();
  const related = (all ?? [])
    .filter((a) => a.category_slug === article.category_slug && a.id !== article.id)
    .slice(0, 5);

  return (
    <ThreePane>
      <article className="rounded-md border border-border bg-card p-4 sm:p-6">
        <Link
          to="/category/$slug"
          params={{ slug: article.category_slug }}
          className="text-xs font-bold text-primary"
        >
          {article.category_label}
        </Link>
        <h1 className="headline mt-2 text-2xl leading-snug font-bold sm:text-3xl">{article.title}</h1>
        {article.summary ? (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{article.summary}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-4 border-y border-border py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {article.place}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.time_label}
          </span>
        </div>

        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            width={1024}
            height={640}
            className="mt-4 aspect-video w-full rounded-sm object-cover"
          />
        ) : null}

        <div className="mt-4 space-y-4 text-[15px] leading-8">
          {articleParagraphs(article).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <ShareBar article={article} />
      </article>

      {related.length > 0 && (
        <section className="mt-6 rounded-md border border-border bg-card p-3">
          <SectionHeading>इसे भी पढ़ें</SectionHeading>
          <div className="space-y-3">
            {related.map((a) => (
              <RailItem key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </ThreePane>
  );
}
