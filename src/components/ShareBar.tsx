import { Download, Facebook, ImageIcon, Link2, Send, Share2, Twitter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAds, useSiteSettings, type Article } from "@/lib/content";
import { renderShareCard } from "@/lib/share-image";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M20.5 3.5A11 11 0 0 0 3.2 17L2 22l5.2-1.2A11 11 0 1 0 20.5 3.5Zm-8.4 17a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.7.7-3-.2-.3A9 9 0 1 1 12.1 20.5Zm5-6.6c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-3.6-3.2c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.6-1.4-.8-1.9-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A3 3 0 0 0 6.8 11a5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4 5.3 5.3 0 0 0 3.2.7 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z" />
  </svg>
);

export function ShareBar({ article }: { article: Article }) {
  const { data: settings } = useSiteSettings();
  const { data: ads } = useAds();
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<{ url: string; blob: Blob } | null>(null);

  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(window.location.href);
  }, []);
  const text = `${article.title} — ${settings?.site_name ?? "जय हिन्द भारत"}`;
  const enc = encodeURIComponent;

  const links = [
    { label: "WhatsApp", icon: <WhatsAppIcon />, href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    {
      label: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      label: "X",
      icon: <Twitter className="h-4 w-4" />,
      href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    },
    {
      label: "Telegram",
      icon: <Send className="h-4 w-4" />,
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    },
  ];

  const makeCard = async () => {
    setBusy(true);
    try {
      const headerAd = (ads ?? []).find((a) => a.placement.startsWith("header") && a.image_url);
      const blob = await renderShareCard({
        title: article.title,
        summary: article.summary || article.body.split(/\n{2,}/)[0] || "",
        kicker: article.kicker,
        place: article.place,
        timeLabel: article.time_label,
        imageUrl: article.image_url,
        logoUrl: settings?.logo_url ?? null,
        adUrl: headerAd?.image_url ?? null,
        siteName: settings?.site_name ?? "जय हिन्द भारत",
        siteUrl: typeof window === "undefined" ? "" : window.location.host,
      });
      setCard({ url: URL.createObjectURL(blob), blob });
    } catch {
      toast.error("तस्वीर नहीं बन सकी");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!card) return;
    const a = document.createElement("a");
    a.href = card.url;
    a.download = `${article.slug ?? "khabar"}.jpg`;
    a.click();
  };

  const shareFile = async () => {
    if (!card) return;
    const file = new File([card.blob], `${article.slug ?? "khabar"}.jpg`, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: article.title, text });
      } catch {
        /* user cancelled */
      }
    } else {
      download();
      toast.success("तस्वीर डाउनलोड हो गई — अब स्टेटस पर लगाएं");
    }
  };

  return (
    <div className="mt-5 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <Share2 className="h-3.5 w-3.5" /> शेयर करें
        </span>
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${l.label} पर शेयर करें`}
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground hover:bg-accent"
          >
            {l.icon}
          </a>
        ))}
        <button
          type="button"
          aria-label="लिंक कॉपी करें"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(
              () => toast.success("लिंक कॉपी हो गया"),
              () => toast.error("कॉपी नहीं हुआ"),
            );
          }}
          className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-accent"
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void makeCard()}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {busy ? "बन रहा है…" : "तस्वीर के रूप में शेयर करें"}
        </button>
      </div>

      {card && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4">
          <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-md bg-card p-3">
            <div className="flex items-center justify-between pb-2">
              <h3 className="headline text-sm font-bold">स्टेटस के लिए तस्वीर</h3>
              <button
                type="button"
                aria-label="बंद करें"
                onClick={() => {
                  URL.revokeObjectURL(card.url);
                  setCard(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img src={card.url} alt={article.title} className="w-full rounded-sm border border-border" />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void shareFile()}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Share2 className="h-3.5 w-3.5" /> शेयर करें
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
              >
                <Download className="h-3.5 w-3.5" /> डाउनलोड
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
