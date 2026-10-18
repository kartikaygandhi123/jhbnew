import assets from './static-assets.json';

/** Resolve historical references without rewriting existing database rows. */
export function resolveMediaUrl(value: string): string {
  const match = value.match(/^(?:https:\/\/[^/]+)?\/__l5e\/assets-v1\/([^/]+)\/(.+)$/);
  if (!match) return value;
  const id = match[1], filename = match[2];
  if (!id || !filename) return value;
  const known = assets.find(asset => asset.id === id && asset.filename === filename);
  return known?.url ?? `/api/public/media/migrated/assets/${id}/${filename}`;
}

export function resolveMediaValues(value: unknown): unknown {
  if (typeof value === 'string') return resolveMediaUrl(value);
  if (Array.isArray(value)) return value.map(resolveMediaValues);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveMediaValues(item)]));
  return value;
}

/** Normalize read responses only; writes and storage bytes remain untouched. */
export function backendFetch(key: string): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    const response = await fetch(input, { ...init, headers });
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    if (method === 'GET' && response.ok && response.url.includes('/rest/v1/') && response.headers.get('content-type')?.includes('application/json')) {
      const outputHeaders = new Headers(response.headers);
      outputHeaders.delete('content-length');
      outputHeaders.delete('content-encoding');
      return new Response(JSON.stringify(resolveMediaValues(await response.json())), { status: response.status, headers: outputHeaders });
    }
    return response;
  };
}