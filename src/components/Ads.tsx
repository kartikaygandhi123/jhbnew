import { X } from "lucide-react";
import { useState } from "react";

import { useAds, type Ad } from "@/lib/content";

/** A single ad creative. Falls back to a labelled placeholder when no image is set. */
export function AdCreative({ ad, className = "" }: { ad: Ad; className?: string }) {
  const box = {
    maxWidth: ad.width > 0 ? `${String(ad.width)}px` : undefined,
    aspectRatio: ad.width > 0 && ad.height > 0 ? `${String(ad.width)} / ${String(ad.height)}` : undefined,
  };

  const inner = ad.image_url ? (
    <img
      src={ad.image_url}
      alt={ad.alt_text || ad.title || "विज्ञापन"}
      loading="lazy"
      decoding="async"
      className="h-full w-full rounded-sm object-cover"
    />
  ) : (
    <div className="grid h-full w-full place-items-center rounded-sm bg-muted text-[11px] font-semibold text-muted-foreground">
      {ad.title || "विज्ञापन"}
    </div>
  );

  return (
    <div className={`mx-auto w-full ${className}`} style={box}>
      {ad.link_url ? (
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored" className="block h-full w-full">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}

/** Renders every active ad for a placement. Renders nothing when there are none. */
export function AdSlot({
  placement,
  limit,
  className = "",
  itemClassName = "",
}: {
  placement: string;
  limit?: number;
  className?: string;
  itemClassName?: string;
}) {
  const { data } = useAds();
  const list = (data ?? []).filter((a) => a.placement === placement).slice(0, limit ?? 99);
  if (list.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {list.map((ad) => (
        <AdCreative key={ad.id} ad={ad} className={itemClassName} />
      ))}
    </div>
  );
}

/** Inserts in-feed ads after every `every` items of a list. */
export function withInFeedAds(nodes: React.ReactNode[], every = 3): React.ReactNode[] {
  return nodes.flatMap((node, i) =>
    (i + 1) % every === 0 && i !== nodes.length - 1
      ? [node, <AdSlot key={`ad-${String(i)}`} placement="in-feed" className="py-1" limit={1} />]
      : [node],
  );
}

/**
 * Hover-ad sizes as CSS variables: phones keep the original width/height,
 * desktops use the separate desktop size (or a modest 320px cap when unset).
 */
function floatSize(ad: Ad): React.CSSProperties {
  const w = ad.width > 0 ? ad.width : 300;
  const h = ad.height > 0 ? ad.height : 250;
  const dw = ad.desktop_width && ad.desktop_width > 0 ? ad.desktop_width : Math.min(w, 320);
  const dh = ad.desktop_height && ad.desktop_height > 0 ? ad.desktop_height : Math.round((dw * h) / w);
  return {
    ["--fa-w" as string]: `${String(w)}px`,
    ["--fa-ar" as string]: `${String(w)} / ${String(h)}`,
    ["--fa-dw" as string]: `${String(dw)}px`,
    ["--fa-dar" as string]: `${String(dw)} / ${String(dh)}`,
  };
}

/** Dismissible ads that hover above the page. */
export function FloatingAds() {
  const { data } = useAds();
  const [closed, setClosed] = useState<string[]>([]);
  const list = (data ?? []).filter((a) => a.placement.startsWith("float") && !closed.includes(a.id));
  if (list.length === 0) return null;

  return (
    <>
      {list.slice(0, 2).map((ad, i) => (
        <div
          key={ad.id}
          className={`float-ad fixed z-40 ${
            i === 0 ? "bottom-3 right-3" : "bottom-3 left-3 hidden sm:block"
          }`}
        >
          <div className="relative rounded-md border border-border bg-card p-1 shadow-lg" style={floatSize(ad)}>
            {ad.dismissible && (
              <button
                type="button"
                aria-label="विज्ञापन बंद करें"
                onClick={() => setClosed((c) => [...c, ad.id])}
                className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <AdCreative ad={ad} className="float-ad-box" />
          </div>
        </div>
      ))}
    </>
  );
}
