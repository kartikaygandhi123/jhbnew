/** Tiny article-body markup: **bold** words, and a paragraph that is only ![caption](url) becomes a photo. */
export type BodyBlock =
  | { kind: 'image'; url: string; caption: string }
  | { kind: 'text'; parts: { text: string; bold: boolean }[] };

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

export function parseBodyBlock(paragraph: string): BodyBlock {
  const trimmed = paragraph.trim();
  const img = IMAGE_LINE.exec(trimmed);
  if (img) return { kind: 'image', caption: img[1] ?? '', url: img[2] ?? '' };
  const parts: { text: string; bold: boolean }[] = [];
  trimmed.split(/(\*\*[^*]+\*\*)/).forEach((piece) => {
    if (!piece) return;
    const bold = piece.startsWith('**') && piece.endsWith('**') && piece.length > 4;
    parts.push({ text: bold ? piece.slice(2, -2) : piece, bold });
  });
  return { kind: 'text', parts };
}

/** Body text without markup (for summaries, share cards and search). */
export function plainBody(body: string): string {
  return body
    .split(/\n{2,}/)
    .filter((p) => !IMAGE_LINE.test(p.trim()))
    .join('\n\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1');
}
