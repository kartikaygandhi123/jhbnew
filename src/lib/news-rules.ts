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