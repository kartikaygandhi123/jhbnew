import { describe, expect, it } from "vitest";

import { mediaPathFromUrl, parseRetention, retentionCutoff } from "./retention";
import { parseYouTubeId } from "./youtube";

describe("auto delete", () => {
  const now = new Date("2026-11-06T00:00:00Z");
  it("is off by default", () => {
    expect(parseRetention(null)).toBe(0);
    expect(retentionCutoff(0, now)).toBeNull();
  });
  it("1 month removes news older than a month", () => {
    expect(retentionCutoff(1, now)?.toISOString()).toBe("2026-10-06T00:00:00.000Z");
  });
  it("3 months removes news older than three months", () => {
    expect(retentionCutoff(parseRetention("3"), now)?.toISOString()).toBe("2026-08-06T00:00:00.000Z");
  });
  it("rejects unsupported periods", () => {
    expect(parseRetention("6")).toBe(0);
  });
  it("only deletes newsroom uploads", () => {
    expect(mediaPathFromUrl("/api/public/media/uploads/a.jpg")).toBe("uploads/a.jpg");
    expect(mediaPathFromUrl("/jhb-logo.png")).toBeNull();
  });
});

describe("article video links", () => {
  it("reads common YouTube links", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("not a video")).toBeNull();
  });
});
