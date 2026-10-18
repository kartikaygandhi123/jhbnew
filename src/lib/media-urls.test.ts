import { describe, expect, it } from 'vitest';
import { resolveMediaUrl, resolveMediaValues } from './media-urls';

describe('portable media without database rewrites', () => {
  it('serves the historical logo from repository files', () => {
    expect(resolveMediaUrl('/__l5e/assets-v1/ff7b3b13-4c01-4734-99a5-eb83aff61ecd/jhb-logo.png')).toBe('/assets/ff7b3b13-4c01-4734-99a5-eb83aff61ecd/jhb-logo.png');
  });
  it('preserves new external newsroom media URLs', () => {
    expect(resolveMediaUrl('/api/public/media/articles/photo.jpg')).toBe('/api/public/media/articles/photo.jpg');
  });
  it('resolves unknown legacy objects through external storage, never managed hosting', () => {
    expect(resolveMediaUrl('https://old.example/__l5e/assets-v1/unknown/photo.jpg')).toBe('/api/public/media/migrated/assets/unknown/photo.jpg');
  });
  it('normalizes nested read values without changing the source object', () => {
    const source = { rows: [{ image_url: '/__l5e/assets-v1/unknown/photo.jpg', title: 'Original' }] };
    expect(resolveMediaValues(source)).toEqual({ rows: [{ image_url: '/api/public/media/migrated/assets/unknown/photo.jpg', title: 'Original' }] });
    expect(source.rows[0]?.image_url).toBe('/__l5e/assets-v1/unknown/photo.jpg');
  });
});