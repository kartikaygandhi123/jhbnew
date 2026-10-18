import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import type { ReactNode } from "react";

import logo from "@/assets/jhb-logo-new.png.asset.json";
import { articleKey, type Article } from "@/lib/content";
import { kickerColor } from "@/lib/news-rules";

export function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="section-rule headline mb-3 text-xl font-bold sm:text-2xl">{children}</h2>;
}

const toneClass: Record<string, string> = {
  saffron: "card-tone-saffron",
  green: "card-tone-green",
  plain: "bg-card",
};

/** Compact card with a thumbnail on the left — used in the two top grids. */
export function TileCard({ article }: { article: Article }) {
  return (
    <Link to="/article/$id" params={{ id: articleKey(article) }} className="block h-full min-w-0">
      <article
        className={`flex h-full gap-3 overflow-hidden rounded-md border border-border p-3 transition-shadow hover:shadow-sm ${
          toneClass[article.tone] ?? "bg-card"
        }`}
      >
        {article.image_url ? (
          <img
            src={article.image_url}
            alt=""
            width={1024}
            height={640}
            loading="lazy"
            decoding="async"
            className="h-24 w-20 shrink-0 rounded-sm bg-muted/40 object-contain sm:h-28 sm:w-24 lg:w-28"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={`line-clamp-2 [overflow-wrap:anywhere] text-[11px] font-bold kicker-${kickerColor(article.kicker_color)}`}>{article.kicker}</p>
          <h3 className="headline line-clamp-4 [overflow-wrap:anywhere] text-[15px] leading-relaxed font-bold sm:text-base">
            <span className="text-primary">{article.category_label}: </span>
            {article.title}
          </h3>
          <p className="mt-1 line-clamp-2 [overflow-wrap:anywhere] text-xs text-muted-foreground">{article.summary}</p>
        </div>
      </article>
    </Link>
  );
}

/** Full feed item with image, meta row and action bar. */
export function FeedCard({ article }: { article: Article }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-md border border-border bg-card">
      <Link to="/article/$id" params={{ id: articleKey(article) }} className="block">
        <div className="flex gap-3 p-3">
          <div className="min-w-0 flex-1">
            <h3 className="headline line-clamp-4 [overflow-wrap:anywhere] text-base leading-relaxed font-bold sm:text-lg">
              {article.kicker ? <span className={`font-bold kicker-${kickerColor(article.kicker_color)}`}>{article.kicker}: </span> : null}
              {article.title}
            </h3>
            <p className="mt-2 line-clamp-3 [overflow-wrap:anywhere] text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
          </div>
          {article.image_url ? (
            <img
              src={article.image_url}
              alt=""
              width={1024}
              height={640}
              loading="lazy"
              decoding="async"
              className="h-24 w-20 shrink-0 rounded-sm bg-muted/40 object-contain sm:h-28 sm:w-44"
            />
          ) : null}
        </div>
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex min-w-0 flex-wrap items-center gap-2 [overflow-wrap:anywhere]">
          <Link
            to="/category/$slug"
            params={{ slug: article.category_slug }}
            className="font-semibold hover:text-primary"
          >
            {article.place}
          </Link>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.time_label}
          </span>
        </span>
        <Link
          to="/article/$id"
          params={{ id: articleKey(article) }}
          className="shrink-0 font-bold text-primary hover:underline"
        >
          Read More...
        </Link>
      </div>
    </article>
  );
}

/** Text-only list item — used inside the rails. */
export function RailItem({ article, withThumb }: { article: Article; withThumb?: boolean }) {
  return (
    <Link to="/article/$id" params={{ id: articleKey(article) }} className="block">
      <article className="flex gap-2 border-b border-border pb-3 last:border-0">
        <div className="min-w-0">
          <h3 className="headline line-clamp-4 [overflow-wrap:anywhere] text-[13px] leading-relaxed font-semibold">
            {article.kicker ? <span className={`font-bold kicker-${kickerColor(article.kicker_color)}`}>{article.kicker}: </span> : null}
            {article.title}
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{article.time_label}</p>
        </div>
        {withThumb && article.image_url ? (
          <img
            src={article.image_url}
            alt=""
            width={1024}
            height={640}
            loading="lazy"
            decoding="async"
            className="h-14 w-20 shrink-0 rounded-sm bg-muted/40 object-contain"
          />
        ) : null}
      </article>
    </Link>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-md border border-border bg-card py-6" aria-label="खबरें लोड हो रही हैं">
      <img src={logo.url} alt="जय हिन्द भारत" width={240} height={160} className="w-28 animate-pulse sm:w-36" />
      <span className="sr-only">{String(rows)} खबरें लोड हो रही हैं</span>
    </div>
  );
}
