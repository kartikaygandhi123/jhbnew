import { Link } from "@tanstack/react-router";
import { useCategories, useSiteSettings } from "@/lib/content";
import { FacebookBrandIcon, InstagramBrandIcon, XBrandIcon, YoutubeBrandIcon } from "@/components/SocialIcons";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/61593525603116",
    icon: FacebookBrandIcon,
    className: "bg-social-facebook",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/jaihindbharathindi",
    icon: InstagramBrandIcon,
    className: "bg-social-instagram",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@jaihindbharatnews",
    icon: YoutubeBrandIcon,
    className: "bg-social-youtube",
  },
];

export function SiteFooter() {
  const { data: categories } = useCategories();
  const { data: settings } = useSiteSettings();

  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="tricolor-rule" />
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.site_name} width={180} height={120} className="h-10 w-auto" />
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
              className={`grid h-8 w-8 place-items-center rounded-full text-primary-foreground ${className}`}
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
          <a
            href="https://x.com/jaihindbharathindi"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            title="X"
            className="grid h-8 w-8 place-items-center rounded-full bg-social-x text-primary-foreground"
          >
            <XBrandIcon className="h-4 w-4" />
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
