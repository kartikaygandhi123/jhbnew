import { Link } from "@tanstack/react-router";
import { Bookmark, Clock, Facebook, MoreVertical, Smile } from "lucide-react";
import type { ReactNode } from "react";

import { articleKey, type Article } from "@/lib/content";

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
    <Link to="/article/$id" params={{ id: articleKey(article) }} className="block">
      <article
        className={`flex gap-3 rounded-md border border-border p-3 transition-shadow hover:shadow-sm ${
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
            className="h-24 w-32 shrink-0 rounded-sm object-cover sm:h-28 sm:w-40"
          />
        ) : null}
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">{article.kicker}</p>
          <h3 className="headline text-[15px] font-bold sm:text-base">
            <span className="text-primary">{article.category_label}: </span>
            {article.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article.summary}</p>
        </div>
      </article>
    </Link>
  );
}

/** Full feed item with image, meta row and action bar. */
export function FeedCard({ article }: { article: Article }) {
  return (
    <article className="overflow-hidden rounded-md border border-border bg-card">
      <Link to="/article/$id" params={{ id: articleKey(article) }} className="block">
        <div className="flex gap-3 p-3">
          <div className="min-w-0 flex-1">
            <h3 className="headline text-base font-bold sm:text-lg">
              {article.kicker ? <span className="text-primary">{article.kicker}: </span> : null}
              {article.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
          </div>
          {article.image_url ? (
            <img
              src={article.image_url}
              alt=""
              width={1024}
              height={640}
              loading="lazy"
              decoding="async"
              className="h-24 w-32 shrink-0 rounded-sm object-cover sm:h-28 sm:w-44"
            />
          ) : null}
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
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
        <span className="flex items-center gap-3">
          <Smile className="h-4 w-4" />
          <Facebook className="h-4 w-4" />
          <Bookmark className="h-4 w-4" />
          <MoreVertical className="h-4 w-4" />
        </span>
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
          <h3 className="headline text-[13px] font-semibold">
            {article.kicker ? <span className="text-primary">{article.kicker}: </span> : null}
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
            className="h-14 w-20 shrink-0 rounded-sm object-cover"
          />
        ) : null}
      </article>
    </Link>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
