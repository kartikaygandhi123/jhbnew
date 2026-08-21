import { Link } from "@tanstack/react-router";
import { MapPin, Menu, Search, X } from "lucide-react";
import { useState } from "react";

import logo from "@/assets/jhb-logo-new.png.asset.json";
import { BreakingTicker } from "@/components/BreakingTicker";
import { categories, trendingTags } from "@/data/news";

const navLinks = [
  { to: "/", label: "होम" },
  { to: "/epaper", label: "ई-पेपर" },
  { to: "/live-tv", label: "लाइव टीवी" },
  { to: "/videos", label: "वीडियो" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card">
      {/* Masthead */}
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center">
          <img
            src={logo.url}
            alt="जय हिन्द भारत"
            width={520}
            height={348}
            className="h-14 w-auto sm:h-20"
          />
        </Link>
        <p className="hidden text-xs font-semibold tracking-wide text-muted-foreground sm:block">
          निष्पक्ष • निर्भीक • निरंतर
        </p>
      </div>

      {/* Dark navigation bar */}
      <div className="bg-navy text-primary-foreground">
        <div className="mx-auto flex max-w-[1400px] items-stretch px-2">
          <button
            type="button"
            aria-label="मेन्यू"
            onClick={() => setOpen((v) => !v)}
            className="grid w-12 shrink-0 place-items-center transition-colors hover:bg-white/10"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <nav className="flex flex-1 items-stretch overflow-x-auto whitespace-nowrap">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-primary" }}
                className="flex items-center px-4 py-3 text-sm font-bold transition-colors hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to="/category/$slug"
                params={{ slug: cat.slug }}
                activeProps={{ className: "bg-primary" }}
                className="hidden items-center px-4 py-3 text-sm font-bold transition-colors hover:bg-white/10 md:flex"
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="hidden items-center gap-1.5 px-4 text-sm font-semibold transition-colors hover:bg-white/10 sm:flex"
          >
            <MapPin className="h-4 w-4" />
            मेरा शहर
          </button>
          <button
            type="button"
            aria-label="खोजें"
            className="grid w-12 shrink-0 place-items-center transition-colors hover:bg-white/10"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Trending strip */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 overflow-x-auto px-4 py-2 text-xs whitespace-nowrap">
          <span className="font-bold text-primary">#</span>
          {trendingTags.map((tag) => (
            <span key={tag} className="cursor-pointer text-muted-foreground hover:text-primary">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {open && (
        <nav className="border-b border-border bg-card px-4 py-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[...navLinks, ...categories.map((c) => ({ to: `/category/${c.slug}`, label: c.label }))].map(
              (item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
