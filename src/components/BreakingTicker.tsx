import { Link } from "@tanstack/react-router";
import { Radio } from "lucide-react";

import { articleKey, useArticles, useSiteSettings } from "@/lib/content";

export function BreakingTicker() {
  const { data: articles } = useArticles();
  const { data: settings } = useSiteSettings();

  const items = (articles ?? []).filter((a) => a.is_breaking).slice(0, 12);
  if (items.length === 0) return null;

  const seconds = settings?.ticker_seconds ?? 40;

  return (
    <div className="flex items-stretch overflow-hidden bg-primary text-primary-foreground">
      <span className="flex shrink-0 items-center gap-1.5 bg-headline px-3 py-1.5 text-xs font-bold tracking-wide">
        <Radio className="h-3.5 w-3.5 animate-pulse" /> {settings?.breaking_label ?? "ब्रेकिंग"}
      </span>
      <div className="ticker-viewport flex-1">
        <div className="ticker-track" style={{ animationDuration: `${String(seconds)}s` }}>
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {items.map((a) => (
                <Link
                  key={`${String(dup)}-${a.id}`}
                  to="/article/$id"
                  params={{ id: articleKey(a) }}
                  className="px-6 text-xs font-semibold whitespace-nowrap hover:underline sm:text-sm"
                >
                  <span className="mr-2 opacity-80">•</span>
                  {a.title}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
