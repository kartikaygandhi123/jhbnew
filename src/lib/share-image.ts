/**
 * Renders a portrait "share as image" card (1080x1920, WhatsApp-status sized)
 * for an article: site logo, optional header advert, headline, photo and text.
 */

export interface ShareCardInput {
  title: string;
  summary: string;
  kicker: string;
  place: string;
  timeLabel: string;
  imageUrl: string | null;
  logoUrl: string | null;
  adUrl: string | null;
  siteName: string;
  siteUrl: string;
}

const W = 1080;
const H = 1920;

function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const [logo, photo, ad] = await Promise.all([
    loadImage(input.logoUrl),
    loadImage(input.imageUrl),
    loadImage(input.adUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  let y = 40;

  // Masthead
  if (logo) {
    const lw = Math.min(760, logo.width);
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, y, lw, lh);
    y += lh + 24;
  } else {
    ctx.fillStyle = "#111111";
    ctx.font = "bold 78px serif";
    ctx.textAlign = "center";
    ctx.fillText(input.siteName, W / 2, y + 76);
    y += 120;
  }

  ctx.fillStyle = "#c81e1e";
  ctx.fillRect(40, y, W - 80, 8);
  y += 30;

  // Header advert
  if (ad) {
    const ah = 150;
    drawCover(ctx, ad, 40, y, W - 80, ah);
    y += ah + 26;
  }

  // Headline
  ctx.textAlign = "center";
  ctx.fillStyle = "#c81e1e";
  ctx.font = "bold 40px sans-serif";
  const kicker = [input.kicker, input.place].filter(Boolean).join(" • ");
  if (kicker) {
    ctx.fillText(kicker, W / 2, y + 40);
    y += 70;
  }

  ctx.fillStyle = "#111111";
  ctx.font = "bold 66px serif";
  const titleLines = wrap(ctx, input.title, W - 100).slice(0, 5);
  for (const line of titleLines) {
    ctx.fillText(line, W / 2, y + 66);
    y += 86;
  }
  y += 18;

  // Photo
  if (photo) {
    const ph = 700;
    drawCover(ctx, photo, 40, y, W - 80, ph);
    y += ph + 30;
  }

  // Summary
  ctx.textAlign = "left";
  ctx.fillStyle = "#222222";
  ctx.font = "42px serif";
  const maxY = H - 190;
  const bodyLines = wrap(ctx, input.summary, W - 100);
  for (const line of bodyLines) {
    if (y + 56 > maxY) break;
    ctx.fillText(line, 50, y + 44);
    y += 62;
  }

  // Footer
  ctx.fillStyle = "#c81e1e";
  ctx.fillRect(0, H - 130, W, 130);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 44px sans-serif";
  ctx.fillText(input.siteUrl, W / 2, H - 72);
  ctx.font = "32px sans-serif";
  ctx.fillText(input.timeLabel, W / 2, H - 28);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("image render failed"))),
      "image/jpeg",
      0.92,
    );
  });
}
