export type CarouselSlide = {
  imageUrl: string;
  href?: string;
  alt?: string;
};

/** One horizontal rail above the main “All products” grid. */
export type HomeAboveProductsHighlight =
  | { kind: "bestsellers" }
  | { kind: "category"; slug: string };

export const MAX_HOME_HIGHLIGHT_RAILS = 16;

/**
 * Persisted on `ShopSettings.homeProductMode` (single selection / legacy).
 * Legacy `featured`, `random`, and `all` are read as bestsellers rail.
 */
export function parseStoredHomeHighlight(
  raw: string | null | undefined,
): HomeAboveProductsHighlight {
  const r = (raw ?? "").trim();
  if (r.startsWith("category:")) {
    const slug = r.slice("category:".length).trim();
    if (slug.length > 0) return { kind: "category", slug };
  }
  if (
    r === "bestsellers" ||
    r === "featured" ||
    r === "random" ||
    r === "all" ||
    r === ""
  ) {
    return { kind: "bestsellers" };
  }
  return { kind: "bestsellers" };
}

export function serializeHomeHighlight(
  h: HomeAboveProductsHighlight,
): string {
  if (h.kind === "bestsellers") return "bestsellers";
  return `category:${h.slug}`;
}

export function categoryHighlightStorageValue(slug: string): string {
  return `category:${slug.trim()}`;
}

/** Dedupe + cap length; drops invalid tokens. */
export function normalizeHomeHighlightRailTokens(
  tokens: readonly unknown[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tokens) {
    if (typeof raw !== "string") continue;
    const t = raw.trim();
    if (t === "bestsellers") {
      if (seen.has("bestsellers")) continue;
      seen.add("bestsellers");
      out.push("bestsellers");
      continue;
    }
    if (t.startsWith("category:")) {
      const slug = t.slice("category:".length).trim();
      if (!slug) continue;
      const key = `category:${slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out.slice(0, MAX_HOME_HIGHLIGHT_RAILS);
}

export function railsStorageStringsFromSettings(
  railsJson: unknown,
  legacyMode: string | null | undefined,
): string[] {
  if (Array.isArray(railsJson) && railsJson.length > 0) {
    const normalized = normalizeHomeHighlightRailTokens(railsJson);
    if (normalized.length > 0) return normalized;
  }
  return [serializeHomeHighlight(parseStoredHomeHighlight(legacyMode))];
}

/** Admin form: drop category rails whose slug no longer exists. */
export function filterRailsToKnownCategories(
  rails: string[],
  categories: { slug: string }[],
): string[] {
  const slugs = new Set(categories.map((c) => c.slug));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of rails) {
    const t = token.trim();
    if (t === "bestsellers") {
      if (!seen.has("bestsellers")) {
        seen.add("bestsellers");
        out.push("bestsellers");
      }
      continue;
    }
    if (t.startsWith("category:")) {
      const slug = t.slice("category:".length).trim();
      if (!slug || !slugs.has(slug)) continue;
      const key = `category:${slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out.length > 0 ? out : ["bestsellers"];
}

export function parseStoredHomeHighlightRails(
  railsJson: unknown,
  legacyMode: string | null | undefined,
): HomeAboveProductsHighlight[] {
  return railsStorageStringsFromSettings(railsJson, legacyMode).map((tok) => {
    if (tok === "bestsellers") return { kind: "bestsellers" as const };
    const slug = tok.slice("category:".length).trim();
    return { kind: "category" as const, slug };
  });
}

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};

export function parseCarouselSlides(json: unknown): CarouselSlide[] {
  if (!Array.isArray(json)) return [];
  const out: CarouselSlide[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl.trim() : "";
    if (!imageUrl) continue;
    out.push({
      imageUrl,
      href: typeof o.href === "string" ? o.href.trim() || undefined : undefined,
      alt: typeof o.alt === "string" ? o.alt.trim() || undefined : undefined,
    });
  }
  return out;
}

/** Shown on the storefront in development when no slides are saved (e.g. DB offline). */
export const DEMO_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1600&q=80",
    href: "/products",
    alt: "Wear your philosophy — shop the collection",
  },
];

export function getCarouselSlidesForHome(json: unknown): CarouselSlide[] {
  const parsed = parseCarouselSlides(json);
  if (parsed.length > 0) return parsed;
  if (process.env.NODE_ENV === "development") {
    return DEMO_CAROUSEL_SLIDES;
  }
  return [];
}
