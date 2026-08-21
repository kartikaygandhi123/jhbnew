import { Link } from "@tanstack/react-router";
import { Radio } from "lucide-react";

import { latestNews, trendingNews } from "@/data/news";

const items = [...latestNews, ...trendingNews];

export function BreakingTicker() {
  return (
    <div className="flex items-stretch overflow-hidden bg-primary text-primary-foreground">
      <span className="flex shrink-0 items-center gap-1.5 bg-headline px-3 py-1.5 text-xs font-bold tracking-wide">
        <Radio className="h-3.5 w-3.5 animate-pulse" /> ब्रेकिंग
      </span>
      <div className="ticker-viewport flex-1">
        <div className="ticker-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {items.map((a) => (
                <Link
                  key={`${String(dup)}-${a.id}`}
                  to="/article/$id"
                  params={{ id: a.id }}
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
