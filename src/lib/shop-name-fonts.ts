/**
 * Curated Google Fonts for the storefront navbar shop name.
 * Ids are stored in `ShopSettings.shopNameFont` (or null for default).
 */

export type ShopNameFontEntry = {
  id: string;
  label: string;
  /** Google Fonts family name for the CSS2 API. Empty = default (no extra request). */
  googleFamily: string;
  group: "Sans" | "Serif" | "Display" | "Script";
};

export const SHOP_NAME_FONTS: ShopNameFontEntry[] = [
  { id: "default", label: "Default (site body)", googleFamily: "", group: "Sans" },
  { id: "inter", label: "Inter", googleFamily: "Inter", group: "Sans" },
  { id: "plus_jakarta_sans", label: "Plus Jakarta Sans", googleFamily: "Plus Jakarta Sans", group: "Sans" },
  { id: "dm_sans", label: "DM Sans", googleFamily: "DM Sans", group: "Sans" },
  { id: "outfit", label: "Outfit", googleFamily: "Outfit", group: "Sans" },
  { id: "sora", label: "Sora", googleFamily: "Sora", group: "Sans" },
  { id: "manrope", label: "Manrope", googleFamily: "Manrope", group: "Sans" },
  { id: "space_grotesk", label: "Space Grotesk", googleFamily: "Space Grotesk", group: "Sans" },
  { id: "syne", label: "Syne", googleFamily: "Syne", group: "Sans" },
  { id: "poppins", label: "Poppins", googleFamily: "Poppins", group: "Sans" },
  { id: "montserrat", label: "Montserrat", googleFamily: "Montserrat", group: "Sans" },
  { id: "raleway", label: "Raleway", googleFamily: "Raleway", group: "Sans" },
  { id: "nunito", label: "Nunito", googleFamily: "Nunito", group: "Sans" },
  { id: "quicksand", label: "Quicksand", googleFamily: "Quicksand", group: "Sans" },
  { id: "work_sans", label: "Work Sans", googleFamily: "Work Sans", group: "Sans" },
  { id: "rubik", label: "Rubik", googleFamily: "Rubik", group: "Sans" },
  { id: "playfair_display", label: "Playfair Display", googleFamily: "Playfair Display", group: "Serif" },
  { id: "cormorant_garamond", label: "Cormorant Garamond", googleFamily: "Cormorant Garamond", group: "Serif" },
  { id: "merriweather", label: "Merriweather", googleFamily: "Merriweather", group: "Serif" },
  { id: "lora", label: "Lora", googleFamily: "Lora", group: "Serif" },
  { id: "fraunces", label: "Fraunces", googleFamily: "Fraunces", group: "Serif" },
  { id: "libre_baskerville", label: "Libre Baskerville", googleFamily: "Libre Baskerville", group: "Serif" },
  { id: "bebas_neue", label: "Bebas Neue", googleFamily: "Bebas Neue", group: "Display" },
  { id: "oswald", label: "Oswald", googleFamily: "Oswald", group: "Display" },
  { id: "archivo_black", label: "Archivo Black", googleFamily: "Archivo Black", group: "Display" },
  { id: "pacifico", label: "Pacifico", googleFamily: "Pacifico", group: "Script" },
  { id: "caveat", label: "Caveat", googleFamily: "Caveat", group: "Script" },
  { id: "great_vibes", label: "Great Vibes", googleFamily: "Great Vibes", group: "Script" },
];

const byId = new Map(SHOP_NAME_FONTS.map((f) => [f.id, f]));

const ALLOWED = new Set(SHOP_NAME_FONTS.map((f) => f.id));

/** Ids allowed in the API / DB (excludes `default`, which is stored as `null`). */
export const STORED_SHOP_NAME_FONT_IDS = SHOP_NAME_FONTS.filter(
  (f) => f.id !== "default",
).map((f) => f.id) as [string, ...string[]];

export function getShopNameFontById(
  value: string | null | undefined,
): ShopNameFontEntry | null {
  if (value == null || value === "" || value === "default") {
    return byId.get("default") ?? null;
  }
  const f = byId.get(value);
  if (f) return f;
  return byId.get("default") ?? null;
}

export function parseStoredShopNameFontId(
  value: string | null | undefined,
): string {
  if (value == null || value === "" || !ALLOWED.has(value)) return "default";
  return value;
}

/**
 * For inline `font-family` on the header link. Null = use theme / Tailwind.
 */
export function shopNameFontCssStack(entry: ShopNameFontEntry | null): string | undefined {
  if (!entry || !entry.googleFamily) return undefined;
  return `'${entry.googleFamily}', var(--font-sans-app), ui-sans-serif, system-ui, sans-serif`;
}

export function googleFontStylesheetUrl(googleFamily: string): string {
  const family = encodeURIComponent(googleFamily).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`;
}
