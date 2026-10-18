import { describe, expect, it } from "vitest";

import { LOCAL_LOGO_URL, resolveLogoUrl } from "./logo";

describe("resolveLogoUrl", () => {
  it("falls back to the committed logo when missing", () => {
    expect(resolveLogoUrl(undefined)).toBe(LOCAL_LOGO_URL);
    expect(resolveLogoUrl(null)).toBe(LOCAL_LOGO_URL);
    expect(resolveLogoUrl("")).toBe(LOCAL_LOGO_URL);
    expect(resolveLogoUrl("   ")).toBe(LOCAL_LOGO_URL);
  });

  it("preserves intentional valid logo URLs", () => {
    expect(resolveLogoUrl("https://cdn.example.com/logo.png")).toBe("https://cdn.example.com/logo.png");
    expect(resolveLogoUrl("/uploads/logo.png")).toBe("/uploads/logo.png");
  });

  it("replaces legacy private asset URLs with the local logo", () => {
    expect(resolveLogoUrl("/__l5e/assets-v1/abc/jhb-logo.png")).toBe(LOCAL_LOGO_URL);
    expect(resolveLogoUrl("https://example.com/__l5e/assets-v1/abc/logo.png")).toBe(LOCAL_LOGO_URL);
  });

  it("rejects unsafe or invalid values", () => {
    expect(resolveLogoUrl("javascript:alert(1)")).toBe(LOCAL_LOGO_URL);
    expect(resolveLogoUrl("not a url")).toBe(LOCAL_LOGO_URL);
  });
});
