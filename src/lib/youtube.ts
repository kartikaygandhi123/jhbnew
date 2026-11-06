/** Accepts a YouTube link (watch, youtu.be, shorts, live, embed) or a bare 11-char ID. */
export function parseYouTubeId(input: string | null | undefined): string | null {
  const value = (input ?? "").trim();
  if (!value) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  const match = value.match(/(?:v=|youtu\.be\/|\/shorts\/|\/live\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? null;
}
