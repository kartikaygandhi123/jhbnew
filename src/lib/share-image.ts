/**
 * Renders a square news clipping for WhatsApp and social sharing.
 * The composition mirrors the website: masthead, header advert, article image,
 * headline, article copy, and a minimal branded footer.
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
const H = 1080;

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

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  family: string,
) {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `bold ${String(size)}px ${family}`;
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { lines, size };
  }
  ctx.font = `bold ${String(minSize)}px ${family}`;
  const lines = wrap(ctx, text, maxWidth).slice(0, maxLines);
  const last = lines[maxLines - 1];
  if (last) lines[maxLines - 1] = `${last.replace(/[.…]+$/, "")}…`;
  return { lines, size: minSize };
}

function drawSocialMarks(ctx: CanvasRenderingContext2D, startX: number, y: number) {
  const marks = [
    { label: "f", color: "#1877f2", font: "bold 24px Arial" },
    { label: "◎", color: "#d62976", font: "bold 25px Arial" },
    { label: "▶", color: "#ff0000", font: "bold 17px Arial" },
    { label: "X", color: "#111111", font: "bold 19px Arial" },
  ];
  marks.forEach((mark, index) => {
    const x = startX + index * 42;
    ctx.fillStyle = mark.color;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = mark.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mark.label, x, y + 1);
  });
  ctx.textBaseline = "alphabetic";
}

export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  await document.fonts?.ready;
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

  const margin = 34;
  const mastheadH = ad ? 142 : 112;
  const logoW = ad ? 290 : 480;
  const logoH = mastheadH - 30;

  // Homepage-style masthead: logo at left and the available advert alongside it.
  if (logo) {
    drawContain(ctx, logo, margin, 14, logoW, logoH);
  } else {
    ctx.fillStyle = "#111111";
    ctx.font = "bold 46px 'Noto Sans Devanagari', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(input.siteName, margin, 78);
  }
  if (ad) drawContain(ctx, ad, margin + logoW + 24, 18, W - margin * 2 - logoW - 24, mastheadH - 36);
  ctx.fillStyle = "#243b73";
  ctx.fillRect(0, mastheadH, W, 16);
  ctx.fillStyle = "#c81e1e";
  ctx.fillRect(0, mastheadH + 16, W, 7);

  let y = mastheadH + 23;
  const footerH = 58;
  const contentBottom = H - footerH;

  // Article image leads the clipping, directly under the website header.
  if (photo) {
    const hasArticleCopy = input.summary.trim().length > 0;
    const photoH = hasArticleCopy ? (ad ? 410 : 440) : ad ? 520 : 560;
    drawCover(ctx, photo, 0, y, W, photoH);
    y += photoH;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, y, W, contentBottom - y);
  y += 20;

  const kicker = [input.kicker, input.place].filter(Boolean).join(" • ");
  if (kicker) {
    ctx.fillStyle = "#c81e1e";
    ctx.textAlign = "left";
    ctx.font = "bold 24px 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(kicker, 44, y + 23);
    y += 38;
  }

  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  const titleFit = fitLines(ctx, input.title, W - 88, 3, 54, 38, "'Noto Sans Devanagari', serif");
  const titleLineH = titleFit.size * 1.32;
  for (const line of titleFit.lines) {
    ctx.fillText(line, 44, y + titleFit.size);
    y += titleLineH;
  }
  y += 12;

  ctx.strokeStyle = "#d9d9d9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(44, y);
  ctx.lineTo(W - 44, y);
  ctx.stroke();
  y += 16;

  ctx.fillStyle = "#292929";
  ctx.font = "28px 'Noto Sans Devanagari', serif";
  const bodyLines = wrap(ctx, input.summary, W - 88);
  for (const line of bodyLines) {
    if (y + 38 > contentBottom - 12) break;
    ctx.fillText(line, 44, y + 28);
    y += 38;
  }

  // Deliberately small footer: social marks and one visit message only.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, H - footerH, W, footerH);
  ctx.fillStyle = "#c81e1e";
  ctx.fillRect(0, H - footerH, W, 3);
  drawSocialMarks(ctx, 62, H - 27);
  ctx.fillStyle = "#c81e1e";
  ctx.textAlign = "right";
  ctx.font = "bold 25px Arial, sans-serif";
  ctx.fillText("For latest news visit jaihindbharat.com", W - 38, H - 19);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("image render failed"))),
      "image/jpeg",
      0.92,
    );
  });
}
