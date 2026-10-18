/**
 * Homepage layout: which sections show and in what order.
 * Stored as JSON inside the `footer_text` column of a dedicated
 * `site_settings` row (id = HOME_LAYOUT_ROW) so no schema change is needed.
 */
export const HOME_LAYOUT_ROW = "home_layout";

export const MAIN_SECTIONS = [
  { id: "top-ad", label: "ऊपर का विज्ञापन" },
  { id: "lead", label: "मुख्य शीर्षक (आज के अहम घटनाक्रम)" },
  { id: "tags", label: "ट्रेंडिंग टैग" },
  { id: "big", label: "बड़ी खबरें" },
  { id: "desh", label: "देश और दुनिया" },
  { id: "feed", label: "आपके लिए" },
] as const;

export const RAIL_SECTIONS = [
  { id: "latest", label: "ताजा खबरें (बायां)" },
  { id: "quick-links", label: "ई-पेपर / वीडियो / लाइव टीवी बटन (बायां)" },
  { id: "trending", label: "ट्रेंडिंग (दायां)" },
  { id: "videos", label: "वीडियो (दायां)" },
] as const;

export type MainSectionId = (typeof MAIN_SECTIONS)[number]["id"];
export type RailSectionId = (typeof RAIL_SECTIONS)[number]["id"];

export interface HomeLayout {
  order: MainSectionId[];
  hidden: string[];
}

export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  order: MAIN_SECTIONS.map((s) => s.id),
  hidden: [],
};

const MAIN_IDS = new Set<string>(MAIN_SECTIONS.map((s) => s.id));
const ALL_IDS = new Set<string>([...MAIN_IDS, ...RAIL_SECTIONS.map((s) => s.id)]);

/** Parses stored JSON; anything invalid falls back to the current default homepage. */
export function parseHomeLayout(raw: string | null | undefined): HomeLayout {
  if (!raw) return DEFAULT_HOME_LAYOUT;
  try {
    const value = JSON.parse(raw) as Partial<HomeLayout>;
    const order = (Array.isArray(value.order) ? value.order : []).filter(
      (id, i, arr): id is MainSectionId => MAIN_IDS.has(id) && arr.indexOf(id) === i,
    );
    // Sections added later get appended so they never disappear silently.
    for (const id of DEFAULT_HOME_LAYOUT.order) if (!order.includes(id)) order.push(id);
    const hidden = (Array.isArray(value.hidden) ? value.hidden : []).filter((id) => ALL_IDS.has(id));
    return { order, hidden };
  } catch {
    return DEFAULT_HOME_LAYOUT;
  }
}

export function serializeHomeLayout(layout: HomeLayout): string {
  return JSON.stringify(parseHomeLayout(JSON.stringify(layout)));
}

export function isVisible(layout: HomeLayout, id: string): boolean {
  return !layout.hidden.includes(id);
}

export function moveSection(layout: HomeLayout, id: MainSectionId, delta: -1 | 1): HomeLayout {
  const order = [...layout.order];
  const i = order.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= order.length) return layout;
  [order[i], order[j]] = [order[j]!, order[i]!];
  return { ...layout, order };
}

export function toggleSection(layout: HomeLayout, id: string): HomeLayout {
  return {
    ...layout,
    hidden: layout.hidden.includes(id) ? layout.hidden.filter((h) => h !== id) : [...layout.hidden, id],
  };
}
