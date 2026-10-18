export const KICKER_COLORS = ['saffron', 'green', 'red', 'black'] as const;
export type KickerColor = typeof KICKER_COLORS[number];

export function kickerColor(value: unknown): KickerColor {
  return KICKER_COLORS.find((color) => color === value) ?? 'red';
}

export function homepageArticle<T extends { published: boolean; section: string; is_homepage_main?: boolean }>(articles: T[]): T | undefined {
  return articles.find((article) => article.published && article.is_homepage_main)
    ?? articles.find((article) => article.published && article.section === 'big');
}