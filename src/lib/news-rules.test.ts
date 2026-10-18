import { describe, expect, it } from 'vitest';
import { homepageArticle, kickerColor, KICKER_COLORS } from './news-rules';

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