import type { StoreCategory } from "@/types/home";

/**
 * Single source for seed + storefront fallback (`getHomeCategories`).
 * Icons: small square-friendly Unsplash crops for layout checks.
 */
export const HOME_CATEGORY_DEFINITIONS = [
  {
    name: "Trousers",
    slug: "trousers",
    sortOrder: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1541099649105-f69ad21fb324?auto=format&fit=crop&w=320&q=80",
  },
  {
    name: "T-shirts",
    slug: "tshirts",
    sortOrder: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=320&q=80",
  },
  {
    name: "Hoodies",
    slug: "hoodies",
    sortOrder: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1556905055-8f3581a7b9a3?auto=format&fit=crop&w=320&q=80",
  },
] as const;

/** Used when the database is unavailable or has no `showOnHome` categories. */
export const MOCK_HOME_CATEGORIES: StoreCategory[] =
  HOME_CATEGORY_DEFINITIONS.map((c) => ({
    id: `mock-cat-${c.slug}`,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
  }));
