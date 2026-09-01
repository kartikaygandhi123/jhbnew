import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

import { AdSlot } from "@/components/Ads";
import { BreakingTicker } from "@/components/BreakingTicker";
import { useCategories, useSiteSettings } from "@/lib/content";

const navLinks = [
  { to: "/", label: "होम" },
  { to: "/epaper", label: "ई-पेपर" },
  { to: "/live-tv", label: "लाइव टीवी" },
  { to: "/videos", label: "वीडियो" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { data: settings } = useSiteSettings();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setSearchOpen(false);
    setOpen(false);
    void navigate({ to: "/search", search: { q } });
  };

  return (
    <header className="sticky top-0 z-50 bg-card">
      {/* Masthead */}
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.site_name}
              width={520}
              height={348}
              className="h-14 w-auto sm:h-20"
            />
          ) : (
            <span className="headline text-2xl font-bold">{settings?.site_name ?? "जय हिन्द भारत"}</span>
          )}
        </Link>

        <AdSlot placement="header-center" limit={2} className="hidden min-w-0 flex-1 md:flex" />
        <AdSlot placement="header-right" limit={1} className="hidden w-[300px] shrink-0 lg:flex" />
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

          <nav className="no-scrollbar flex flex-1 items-stretch overflow-x-auto whitespace-nowrap">
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
            {(categories ?? []).map((cat) => (
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
            aria-label="खोजें"
            onClick={() => setSearchOpen((v) => !v)}
            className="grid w-12 shrink-0 place-items-center transition-colors hover:bg-white/10"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submitSearch} className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="खबर खोजें…"
              className="h-9 w-full bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              खोजें
            </button>
          </div>
        </form>
      )}

      <BreakingTicker />

      {open && (
        <nav className="border-b border-border bg-card px-4 py-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
              >
                {item.label}
              </Link>
            ))}
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                to="/category/$slug"
                params={{ slug: cat.slug }}
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
