// Shared logo resolution. The committed /jhb-logo.png is the reliable
// fallback whenever the configured logo is missing or points to a legacy
// private asset URL that an independent VPS cannot serve.
export const LOCAL_LOGO_URL = "/jhb-logo.png";

export function resolveLogoUrl(configured?: string | null): string {
  const url = configured?.trim();
  if (!url) return LOCAL_LOGO_URL;
  // Legacy managed-asset URLs are not portable; never let one break the site.
  if (url.includes("/__l5e/")) return LOCAL_LOGO_URL;
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch {
    /* fall through */
  }
  return LOCAL_LOGO_URL;
}
