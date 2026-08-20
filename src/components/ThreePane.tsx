import type { ReactNode } from "react";

/**
 * Newspaper reading layout: left and right rails stay fixed (sticky, own
 * scroll) while the centre column scrolls with the page.
 */
export function ThreePane({
  left,
  right,
  children,
}: {
  left: ReactNode;
  right: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside className="order-2 lg:order-1">
        <div className="rail-scroll lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)]">{left}</div>
      </aside>

      <main className="order-1 min-w-0 lg:order-2">{children}</main>

      <aside className="order-3">
        <div className="rail-scroll lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)]">{right}</div>
      </aside>
    </div>
  );
}
