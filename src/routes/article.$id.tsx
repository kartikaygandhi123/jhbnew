import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Clock, Facebook, Share2, Twitter } from "lucide-react";

import { LeftRail, RightRail } from "@/components/Rails";
import { ThreePane } from "@/components/ThreePane";
import { articleImageMap, bigNews, deshNews, feedNews, getArticleContent, latestNews, trendingNews } from "@/data/news";

const allArticles = [...bigNews, ...deshNews, ...feedNews, ...latestNews, ...trendingNews];

export const Route = createFileRoute("/article/$id")({
  loader: ({ params }) => {
    const article = allArticles.find((a) => a.id === params.id);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "खबर नहीं मिली — जय हिन्द भारत" }, { name: "robots", content: "noindex" }] };
    }
    const { article } = loaderData;
    const title = `${article.title} — जय हिन्द भारत`;
    const description = article.summary || `${article.category} से जुड़ी ताजा हिंदी खबर।`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const image = articleImageMap[article.id];
  const content = getArticleContent(article);
  const related = allArticles.filter((a) => a.id !== article.id && a.categorySlug === article.categorySlug).slice(0, 3);

  return (
    <ThreePane left={<LeftRail />} right={<RightRail />}>
      <article className="rounded-md border border-border bg-card p-4 sm:p-6">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> होम पर वापस जाएं
        </Link>

        <span className="block text-xs font-bold text-primary">{article.category}</span>
        <h1 className="headline mt-2 text-xl font-bold leading-snug sm:text-2xl lg:text-3xl">{article.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{article.place}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {article.time}
          </span>
        </div>

        {image ? (
          <img
            src={image}
            alt={article.title}
            width={1024}
            height={640}
            className="mt-4 aspect-video w-full rounded-sm object-cover"
          />
        ) : null}

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
          {content.map((paragraph: string, i: number) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">शेयर करें:</span>
          <button
            type="button"
            aria-label="Facebook पर शेयर करें"
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-primary"
          >
            <Facebook className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Twitter पर शेयर करें"
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-primary"
          >
            <Twitter className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="कॉपी लिंक"
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-primary"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="बुकमार्क करें"
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-primary"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-6 rounded-md border border-border bg-card p-4">
          <h2 className="headline mb-3 text-lg font-bold">इसी श्रेणी में और खबरें</h2>
          <div className="space-y-3">
            {related.map((a) => (
              <Link
                key={a.id}
                to="/article/$id"
                params={{ id: a.id }}
                className="block border-b border-border pb-3 last:border-0"
              >
                <p className="text-xs text-primary">{a.category}</p>
                <p className="headline text-sm font-semibold hover:text-primary">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.time}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </ThreePane>
  );
}
