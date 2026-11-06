/**
 * Automatic article clean-up. Stored as the `footer_text` of the
 * site_settings row RETENTION_ROW: "0" (off), "1", "2" or "3" months.
 */
export const RETENTION_ROW = "retention";
export const RETENTION_OPTIONS = [0, 1, 2, 3] as const;
export type RetentionMonths = (typeof RETENTION_OPTIONS)[number];

export function parseRetention(raw: string | null | undefined): RetentionMonths {
  const n = Number(raw);
  return (RETENTION_OPTIONS as readonly number[]).includes(n) ? (n as RetentionMonths) : 0;
}

/** Articles created before this moment are removed. Null when clean-up is off. */
export function retentionCutoff(months: RetentionMonths, now: Date = new Date()): Date | null {
  if (months === 0) return null;
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d;
}

/** Storage path for a newsroom upload URL, or null for anything else (bundled/external images). */
export function mediaPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/api/public/media/";
  const i = url.indexOf(marker);
  if (i < 0) return null;
  const path = decodeURIComponent(url.slice(i + marker.length).split(/[?#]/)[0] ?? "");
  return path && !path.includes("..") ? path : null;
}
