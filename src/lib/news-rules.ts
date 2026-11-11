export const KICKER_COLORS = ['saffron', 'green', 'red', 'black'] as const;
export type KickerColor = typeof KICKER_COLORS[number];

export function kickerColor(value: unknown): KickerColor {
  return KICKER_COLORS.find((color) => color === value) ?? 'red';
}

export function homepageArticle<T extends { published: boolean; section: string; is_homepage_main?: boolean }>(articles: T[]): T | undefined {
  return articles.find((article) => article.published && article.is_homepage_main)
    ?? articles.find((article) => article.published && article.section === 'big');
}

export function articleDetails(article: { place?: string | null; time_label?: string | null; reporter?: string | null }) {
  return {
    place: article.place?.trim() ?? '',
    time: article.time_label?.trim() ?? '',
    reporter: article.reporter?.trim() ?? '',
  };
}

export function recentArticles<T extends { published: boolean; created_at: string }>(articles: readonly T[], limit = 5): T[] {
  const postingTime = (article: T) => Date.parse(article.created_at) || 0;
  return articles.filter((article) => article.published)
    .sort((a, b) => postingTime(b) - postingTime(a))
    .slice(0, limit);
}
/** Site setting row: "off" keeps breaking news in the ticker forever; anything else hides it after 48 hours. */
export const TICKER_EXPIRY_ROW = 'ticker_expiry';
export const TICKER_EXPIRY_HOURS = 48;

export function tickerExpiryOn(raw: string | null | undefined): boolean {
  return raw !== 'off';
}

export function breakingTickerItems<T extends { is_breaking: boolean; created_at: string }>(
  articles: readonly T[],
  expiryOn: boolean,
  now: number = Date.now(),
  limit = 12,
): T[] {
  const cutoff = now - TICKER_EXPIRY_HOURS * 3_600_000;
  return articles
    .filter((a) => a.is_breaking && (!expiryOn || (Date.parse(a.created_at) || 0) >= cutoff))
    .slice(0, limit);
}
