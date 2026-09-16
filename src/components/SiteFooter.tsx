import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";

import { useCategories, useSiteSettings } from "@/lib/content";

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/jaihindbharat", icon: Facebook, className: "text-social-facebook" },
  { label: "Instagram", href: "https://www.instagram.com/jaihindbharat", icon: Instagram, className: "text-social-instagram" },
  { label: "YouTube", href: "https://www.youtube.com/@jaihindbharat", icon: Youtube, className: "text-social-youtube" },
];

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-6.77 7.74L23.2 22H17l-4.86-6.35L6.59 22H3.48l7.2-8.23L3.03 2H9.4l4.39 5.8L18.9 2Zm-1.09 17.84h1.72L8.46 4.05H6.62l11.19 15.79Z" />
    </svg>
  );
}

export function SiteFooter() {
  const { data: categories } = useCategories();
  const { data: settings } = useSiteSettings();

  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="tricolor-rule" />
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.site_name}
              width={180}
              height={120}
              className="h-10 w-auto"
            />
          ) : null}
          <p className="text-xs text-muted-foreground">{settings?.footer_text}</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {(categories ?? []).map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="hover:text-primary">
              {c.label}
            </Link>
          ))}
          <Link to="/epaper" className="hover:text-primary">
            ई-पेपर
          </Link>
          <Link to="/live-tv" className="hover:text-primary">
            लाइव टीवी
          </Link>
          <Link to="/videos" className="hover:text-primary">
            वीडियो
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Follow us</span>
          {socialLinks.map(({ label, href, icon: Icon, className }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className={`grid h-8 w-8 place-items-center rounded-full text-white ${className}`}
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
          <a
            href="https://x.com/jaihindbharat"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            title="X"
            className="grid h-8 w-8 place-items-center rounded-full bg-social-x text-white"
          >
            <XIcon />
          </a>
        </div>
      </div>
      <div className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
        © 2026 {settings?.site_name ?? "जय हिन्द भारत"} — सर्वाधिकार सुरक्षित
        {settings?.contact_email ? ` • ${settings.contact_email}` : ""}
        {settings?.contact_phone ? ` • ${settings.contact_phone}` : ""}
      </div>
    </footer>
  );
}
