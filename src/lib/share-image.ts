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
  reporter?: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  adUrls: string[];
  siteName: string;
  siteUrl: string;
}

export const SITE_DOMAIN = "www.jaihindbharat.com";

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
  const marks = ["facebook", "instagram", "youtube", "x"] as const;
  marks.forEach((mark, index) => {
    const x = startX + index * 40;
    ctx.fillStyle = mark === "facebook" ? "#1877f2" : mark === "instagram" ? "#d62976" : mark === "youtube" ? "#ff0000" : "#111111";
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (mark === "facebook") {
      ctx.font = "bold 23px Arial";
      ctx.fillText("f", x, y + 2);
    } else if (mark === "instagram") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 8, y - 8, 16, 16, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 4.5, y - 4.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (mark === "youtube") {
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 6);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x - 4, y + 6);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(x - 9, y - 9);
      ctx.scale(0.75, 0.75);
      ctx.fill(new Path2D("M18.9 2H22l-6.77 7.74L23.2 22H17l-4.86-6.35L6.59 22H3.48l7.2-8.23L3.03 2H9.4l4.39 5.8L18.9 2Zm-1.09 17.84h1.72L8.46 4.05H6.62l11.19 15.79Z"));
      ctx.restore();
    }
  });
  ctx.textBaseline = "alphabetic";
}

export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  await document.fonts?.ready;
  const [logo, photo, ...ads] = await Promise.all([
    loadImage(input.logoUrl),
    loadImage(input.imageUrl),
    ...input.adUrls.slice(0, 2).map((url) => loadImage(url)),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const margin = 12;
  // Masthead mirrors the site header: logo on the left, advert space on the right.
  const mastheadH = 138;
  const logoW = 218;
  const logoH = mastheadH - 12;

  if (logo) {
    drawContain(ctx, logo, margin, 6, logoW, logoH);
  } else {
    ctx.fillStyle = "#111111";
    ctx.font = "bold 46px 'Noto Sans Devanagari', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(input.siteName, margin, 84);
  }
  const loadedAds = ads.filter((ad): ad is HTMLImageElement => ad !== null);
  const adStart = margin + logoW + 8;
  const adAreaW = W - margin - adStart;
  const adGap = loadedAds.length > 1 ? 6 : 0;
  const adW = loadedAds.length > 0 ? (adAreaW - adGap * (loadedAds.length - 1)) / loadedAds.length : adAreaW;
  loadedAds.forEach((ad, index) => {
    drawCover(ctx, ad, adStart + index * (adW + adGap), 4, adW, mastheadH - 8);
  });

  // Single thin red rule only — no coloured strips.
  ctx.fillStyle = "#c81e1e";
  ctx.fillRect(margin, mastheadH, W - margin * 2, 4);

  let y = mastheadH + 4;
  const footerH = 54;
  const contentBottom = H - footerH;

  if (photo) {
    const hasArticleCopy = input.summary.trim().length > 0;
    const photoH = !hasArticleCopy || input.summary.trim().length < 180 ? 590 : input.summary.trim().length < 320 ? 510 : 430;
    drawCover(ctx, photo, 0, y, W, photoH);
    y += photoH;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, y, W, contentBottom - y);
  y += 18;

  const kicker = [input.kicker, input.place, input.timeLabel, input.reporter].filter((value) => value?.trim()).join(" • ");
  if (kicker) {
    ctx.fillStyle = "#c81e1e";
    ctx.textAlign = "left";
    ctx.font = "bold 23px 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(kicker, 44, y + 21);
    y += 33;
  }

  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  const titleFit = fitLines(ctx, input.title, W - 88, 3, 50, 36, "'Noto Sans Devanagari', serif");
  const titleLineH = titleFit.size * 1.24;
  for (const line of titleFit.lines) {
    ctx.fillText(line, 44, y + titleFit.size);
    y += titleLineH;
  }
  y += 10;

  ctx.strokeStyle = "#e2e2e2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(44, y);
  ctx.lineTo(W - 44, y);
  ctx.stroke();
  y += 14;

  ctx.fillStyle = "#292929";
  ctx.font = "27px 'Noto Sans Devanagari', serif";
  const readMore = `Read More On ${SITE_DOMAIN}`;
  const maxLines = Math.max(1, Math.floor((contentBottom - 10 - y) / 36));
  const bodyLines = wrap(ctx, input.summary, W - 88);
  const shown = bodyLines.slice(0, maxLines);
  const needsMore = bodyLines.length > maxLines;
  if (needsMore) {
    // Trim the last line until "… Read More On …" fits on it.
    let last = shown[maxLines - 1] ?? "";
    const suffix = `… ${readMore}`;
    while (last && ctx.measureText(last + suffix).width > W - 88) last = last.split(" ").slice(0, -1).join(" ");
    shown[maxLines - 1] = last + suffix;
  }
  shown.forEach((line, i) => {
    const isLast = needsMore && i === shown.length - 1;
    if (isLast) {
      const idx = line.lastIndexOf(readMore);
      const head = line.slice(0, idx);
      ctx.fillStyle = "#292929";
      ctx.fillText(head, 44, y + 26);
      ctx.fillStyle = "#c81e1e";
      ctx.font = "bold 27px 'Noto Sans Devanagari', sans-serif";
      ctx.fillText(readMore, 44 + ctx.measureText(head).width, y + 26);
    } else {
      ctx.fillText(line, 44, y + 26);
    }
    y += 36;
  });


  // Deliberately small footer: social marks and one visit message only.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, H - footerH, W, footerH);
  ctx.fillStyle = "#c81e1e";
  ctx.fillRect(0, H - footerH, W, 3);
  drawSocialMarks(ctx, 62, H - 27);
  ctx.fillStyle = "#c81e1e";
  ctx.textAlign = "right";
  ctx.font = "bold 25px Arial, sans-serif";
  ctx.fillText(`For latest news visit ${SITE_DOMAIN}`, W - 38, H - 19);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("image render failed"))),
      "image/jpeg",
      0.92,
    );
  });
}
