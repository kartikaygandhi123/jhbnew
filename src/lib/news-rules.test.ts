import { describe, expect, it } from 'vitest';
import { articleDetails, homepageArticle, kickerColor, KICKER_COLORS, recentArticles, breakingTickerItems, tickerExpiryOn } from './news-rules';

describe('homepage headline selection', () => {
  it('uses the selected published article even outside the big-news section', () => {
    const articles = [{ id: 'old', section: 'big', published: true }, { id: 'selected', section: 'feed', published: true, is_homepage_main: true }];
    expect(homepageArticle(articles)?.id).toBe('selected');
  });
  it('never displays an unpublished selected article', () => {
    const articles = [{ id: 'draft', section: 'feed', published: false, is_homepage_main: true }, { id: 'public', section: 'big', published: true }];
    expect(homepageArticle(articles)?.id).toBe('public');
  });
});

describe('editor kicker colors', () => {
  it('allows exactly saffron, green, red and black', () => {
    expect(KICKER_COLORS).toEqual(['saffron', 'green', 'red', 'black']);
    for (const color of KICKER_COLORS) expect(kickerColor(color)).toBe(color);
    expect(kickerColor('blue')).toBe('red');
  });
});

describe('article details', () => {
  it('uses the actual editor-entered place, date/time, and reporter', () => {
    expect(articleDetails({ place: 'दिल्ली', time_label: '18 अक्टूबर, 14:02', reporter: 'सीमा शर्मा' }))
      .toEqual({ place: 'दिल्ली', time: '18 अक्टूबर, 14:02', reporter: 'सीमा शर्मा' });
  });
  it('leaves missing details blank without invented credits', () => {
    expect(articleDetails({ place: '', time_label: null, reporter: '  ' }))
      .toEqual({ place: '', time: '', reporter: '' });
    expect(articleDetails({})).toEqual({ place: '', time: '', reporter: '' });
  });
});

describe('automatic latest news', () => {
  const articles = [
    { id: 'old', published: true, section: 'latest', sort_order: 0, created_at: '2026-10-17T12:00:00Z' },
    { id: 'new', published: true, section: 'feed', sort_order: 100, created_at: '2026-10-18T08:32:00Z' },
    { id: 'draft', published: false, section: 'big', sort_order: 0, created_at: '2026-10-18T09:00:00Z' },
  ];
  it('orders published news by posting time across sections, not manual order', () => {
    expect(recentArticles(articles).map((article) => article.id)).toEqual(['new', 'old']);
    expect(articles[0]?.id).toBe('old');
  });
  it('removes deleted news and includes newly posted news from the shared source', () => {
    const updated = articles.filter((article) => article.id !== 'new');
    updated.push({ id: 'added', published: true, section: 'desh', sort_order: 200, created_at: '2026-10-18T10:00:00Z' });
    expect(recentArticles(updated).map((article) => article.id)).toEqual(['added', 'old']);
  });
});
describe('breaking ticker 48-hour expiry', () => {
  const now = Date.parse('2026-11-11T12:00:00Z');
  const items = [
    { id: 'fresh', is_breaking: true, created_at: '2026-11-10T13:00:00Z' },
    { id: 'old', is_breaking: true, created_at: '2026-11-09T11:59:00Z' },
    { id: 'normal', is_breaking: false, created_at: '2026-11-11T11:00:00Z' },
  ];
  it('is on by default and hides breaking news older than 48 hours', () => {
    expect(tickerExpiryOn(null)).toBe(true);
    expect(breakingTickerItems(items, true, now).map((a) => a.id)).toEqual(['fresh']);
  });
  it('keeps old breaking news when the admin turns expiry off', () => {
    expect(tickerExpiryOn('off')).toBe(false);
    expect(breakingTickerItems(items, false, now).map((a) => a.id)).toEqual(['fresh', 'old']);
  });
});
