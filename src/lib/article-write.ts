type Row = Record<string, unknown>;
type WriteResult = { data: { id: string } | null; error: { code?: string; message: string } | null };

/** Blank slugs use the article ID route; collisions get a separate URL, never an overwrite. */
export function articlePayload(row: Row): Row {
  const title = String(row['title'] ?? '').trim();
  if (!title) throw new Error('खबर का शीर्षक भरें');
  const slug = String(row['slug'] ?? '').trim();
  return { ...row, title, slug: slug || null };
}

export async function saveArticle(
  row: Row,
  write: (payload: Row) => Promise<WriteResult>,
  uniqueId: () => string = () => crypto.randomUUID(),
): Promise<void> {
  const payload = articlePayload(row);
  let result = await write(payload);
  if (result.error?.code === '23505' && result.error.message.includes('articles_slug_key')) {
    const base = String(payload['slug'] || 'news');
    result = await write({ ...payload, slug: `${base}-${uniqueId()}` });
  }
  if (result.error) throw new Error(result.error.message);
  requireWrittenRow(result.data);
}

/** RLS can return zero affected rows without an API error. Never report that as success. */
export function requireWrittenRow(row: { id: string } | null): void {
  if (!row?.id) throw new Error('बदलाव सेव नहीं हुआ। संपादन अधिकार जांचें और फिर कोशिश करें।');
}