/** Browser helpers that turn a PDF or page image into e-paper page assets. */

const FULL_WIDTH = 1600;
const THUMB_WIDTH = 320;

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("image encode failed"))), "image/jpeg", quality);
  });
}

function scaledCanvas(source: CanvasImageSource, sw: number, sh: number, targetWidth: number) {
  const scale = Math.min(1, targetWidth / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function loadBitmap(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

/** Builds a small thumbnail JPEG from any page image. */
export async function makeThumb(file: Blob, name = "thumb.jpg"): Promise<File> {
  const img = await loadBitmap(file);
  const canvas = scaledCanvas(img, img.naturalWidth, img.naturalHeight, THUMB_WIDTH);
  return new File([await canvasToBlob(canvas, 0.72)], name, { type: "image/jpeg" });
}

export interface RenderedPage {
  full: File;
  thumb: File;
}

/** Renders every page of a PDF into a full-size JPEG plus a thumbnail. */
export async function renderPdfPages(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<RenderedPage[]> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: RenderedPage[] = [];

  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.max(1, 2200 / base.width) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const fullCanvas = scaledCanvas(canvas, canvas.width, canvas.height, FULL_WIDTH * 1.6);
    const fullBlob = await canvasToBlob(fullCanvas, 0.88);
    const thumbCanvas = scaledCanvas(canvas, canvas.width, canvas.height, THUMB_WIDTH);
    const thumbBlob = await canvasToBlob(thumbCanvas, 0.72);

    pages.push({
      full: new File([fullBlob], `page-${String(i).padStart(2, "0")}.jpg`, { type: "image/jpeg" }),
      thumb: new File([thumbBlob], `page-${String(i).padStart(2, "0")}-thumb.jpg`, { type: "image/jpeg" }),
    });
    onProgress?.(i, doc.numPages);
    canvas.width = 0;
    canvas.height = 0;
  }

  return pages;
}
