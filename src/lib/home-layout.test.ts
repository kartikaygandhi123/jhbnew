import { describe, expect, it } from "vitest";
import { DEFAULT_HOME_LAYOUT, isVisible, moveSection, parseHomeLayout, serializeHomeLayout, toggleSection } from "./home-layout";

describe("home layout", () => {
  it("falls back to the current homepage when nothing is saved", () => {
    expect(parseHomeLayout(null)).toEqual(DEFAULT_HOME_LAYOUT);
    expect(parseHomeLayout("not json")).toEqual(DEFAULT_HOME_LAYOUT);
  });
  it("keeps saved order and appends missing sections", () => {
    const l = parseHomeLayout(JSON.stringify({ order: ["feed", "lead"], hidden: ["big"] }));
    expect(l.order.slice(0, 2)).toEqual(["feed", "lead"]);
    expect(l.order).toHaveLength(DEFAULT_HOME_LAYOUT.order.length);
    expect(isVisible(l, "big")).toBe(false);
  });
  it("moves and toggles sections and survives a save round-trip", () => {
    let l = moveSection(DEFAULT_HOME_LAYOUT, "lead", -1);
    expect(l.order[0]).toBe("lead");
    l = toggleSection(l, "latest");
    expect(parseHomeLayout(serializeHomeLayout(l))).toEqual(l);
  });
});
