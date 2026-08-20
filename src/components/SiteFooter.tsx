import { Link } from "@tanstack/react-router";

import logo from "@/assets/jhb-logo-new.png.asset.json";
import { categories } from "@/data/news";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="tricolor-rule" />
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logo.url} alt="जय हिन्द भारत" width={180} height={120} className="h-10 w-auto" />
          <p className="text-xs text-muted-foreground">निष्पक्ष • निर्भीक • निरंतर</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {categories.map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="hover:text-primary">
              {c.label}
            </Link>
          ))}
          <Link to="/epaper" className="hover:text-primary">
            ई-पेपर
          </Link>
          <Link to="/videos" className="hover:text-primary">
            वीडियो
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
        © 2026 जय हिन्द भारत — सर्वाधिकार सुरक्षित
      </div>
    </footer>
  );
}
