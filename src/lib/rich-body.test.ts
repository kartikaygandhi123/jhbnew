import { describe, expect, it } from 'vitest';
import { parseBodyBlock, plainBody } from './rich-body';

describe('article body markup', () => {
  it('turns a photo-only paragraph into an image', () => {
    expect(parseBodyBlock('![रैली](https://x.test/a.jpg)')).toEqual({ kind: 'image', caption: 'रैली', url: 'https://x.test/a.jpg' });
  });
  it('makes **words** bold inside a paragraph', () => {
    expect(parseBodyBlock('आज **बड़ी खबर** है')).toEqual({ kind: 'text', parts: [
      { text: 'आज ', bold: false }, { text: 'बड़ी खबर', bold: true }, { text: ' है', bold: false },
    ] });
  });
  it('strips markup for plain summaries', () => {
    expect(plainBody('एक **दो**\n\n![](https://x.test/a.jpg)\n\nतीन')).toBe('एक दो\n\nतीन');
  });
});
