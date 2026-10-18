import { describe, expect, it } from 'vitest';
import { articlePayload, requireWrittenRow, saveArticle } from './article-write';

describe('article persistence', () => {
  it('saves multiple new articles with empty slugs as null, not duplicate empty URLs', async () => {
    const rows: Record<string, unknown>[] = [];
    for (const title of ['पहली खबर', 'दूसरी खबर']) {
      await saveArticle({ title, slug: '' }, async (payload) => {
        rows.push(payload);
        return { data: { id: String(rows.length) }, error: null };
      });
    }
    expect(rows).toEqual([{ title: 'पहली खबर', slug: null }, { title: 'दूसरी खबर', slug: null }]);
  });
  it('gives a duplicate slug its own URL without changing an existing article', async () => {
    const writes: Record<string, unknown>[] = [];
    await saveArticle({ title: 'नई खबर', slug: 'news' }, async (payload) => {
      writes.push(payload);
      return writes.length === 1
        ? { data: null, error: { code: '23505', message: 'duplicate key violates articles_slug_key' } }
        : { data: { id: 'new-article' }, error: null };
    }, () => 'unique-id');
    expect(writes.map((row) => row['slug'])).toEqual(['news', 'news-unique-id']);
    expect(writes.every((row) => row['id'] === undefined)).toBe(true);
  });
  it('preserves existing IDs and non-conflicting slugs during edits', () => {
    expect(articlePayload({ id: 'existing', title: ' Updated ', slug: 'existing-url' }))
      .toEqual({ id: 'existing', title: 'Updated', slug: 'existing-url' });
  });
  it('does not report success when deletion affects no record', () => {
    expect(() => requireWrittenRow(null)).toThrow();
    expect(() => requireWrittenRow({ id: 'deleted' })).not.toThrow();
  });
  it('does not report a new article saved when no row is returned', async () => {
    await expect(saveArticle({ title: 'खबर' }, async () => ({ data: null, error: null }))).rejects.toThrow();
  });
  it('does not retry unrelated permission failures', async () => {
    let attempts = 0;
    await expect(saveArticle({ title: 'खबर' }, async () => {
      attempts += 1;
      return { data: null, error: { code: '42501', message: 'Permission denied' } };
    })).rejects.toThrow('Permission denied');
    expect(attempts).toBe(1);
  });
});