/** Local-only catalog for UI development — no database required. */

export type StoreSizeOption = {
  id: string;
  label: string;
  /** List price in minor units; null = use product base for the size add-on. */
  priceCents: number | null;
};

export type StoreProductVariant = {
  id: string;
  label: string;
  imageUrl: string | null;
  imageUrl2?: string | null;
  imageUrl3?: string | null;
  /** List price for that variant; null = use product base (variant delta 0). */
  priceCents: number | null;
};

/** Up to 3 non-empty image URLs; primary first. */
export function variantGalleryUrls(v: StoreProductVariant): string[] {
  return [v.imageUrl, v.imageUrl2, v.imageUrl3].filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0,
  );
}

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Base price for add-on rule; cards use min over size×variant. */
  priceCents: number;
  /** Optional; struck through on storefront when above the selling price. */
  mrpCents?: number | null;
  currency: string;
  imageUrl: string | null;
  categorySlug?: string;
  /** Admin-defined size names (letters, numbers, etc.). */
  sizeOptions?: StoreSizeOption[];
  variants?: StoreProductVariant[];
  /** `${variantId}::${sizeId}` → quantity. Missing = 0 (OOS). No map = not tracking. */
  stockByPair?: Record<string, number>;
  /** `${variantId}::${sizeId}` — combination is not sold (cannot add to bag; distinct from OOS). */
  notOfferedByPair?: Record<string, true>;
};

export function stockPairKey(variantId: string, sizeId: string): string {
  return `${variantId}::${sizeId}`;
}

export function getVariantSizeStock(
  product: StoreProduct,
  variantId: string,
  sizeId: string,
): number {
  if (!product.stockByPair) return 999;
  return product.stockByPair[stockPairKey(variantId, sizeId)] ?? 0;
}

/**
 * Per-combination list price: `sizeList + variantList - base`.
 * Omitted / null on a size or variant means “use product base” for that dimension.
 */
export function linePriceCents(
  product: StoreProduct,
  size: StoreSizeOption | null | undefined,
  variant: StoreProductVariant | null | undefined,
): number {
  const b = product.priceCents;
  const sList = !size || size.priceCents == null ? b : size.priceCents;
  const vList = !variant || variant.priceCents == null ? b : variant.priceCents;
  return sList + vList - b;
}

export function minLinePriceCentsForVariant(
  p: StoreProduct,
  v: StoreProductVariant,
): number {
  const sizes = p.sizeOptions ?? [];
  if (sizes.length === 0) return linePriceCents(p, null, v);
  return Math.min(...sizes.map((s) => linePriceCents(p, s, v)));
}

export function maxLinePriceCentsForVariant(
  p: StoreProduct,
  v: StoreProductVariant,
): number {
  const sizes = p.sizeOptions ?? [];
  if (sizes.length === 0) return linePriceCents(p, null, v);
  return Math.max(...sizes.map((s) => linePriceCents(p, s, v)));
}

/** “From …” on cards: minimum over all size × variant combinations. */
export function listFromPriceCents(p: StoreProduct): number {
  const b = p.priceCents;
  const vs = p.variants ?? [];
  const sz = p.sizeOptions ?? [];
  if (vs.length === 0 && sz.length === 0) return b;
  const vIter: (StoreProductVariant | null)[] = vs.length > 0 ? vs : [null];
  const sIter: (StoreSizeOption | null)[] = sz.length > 0 ? sz : [null];
  let minP = Number.POSITIVE_INFINITY;
  for (const v of vIter) {
    for (const s of sIter) {
      const n = linePriceCents(p, s, v);
      if (n < minP) minP = n;
    }
  }
  return minP === Number.POSITIVE_INFINITY ? b : minP;
}

/** True when list price varies by option (show “From …”). */
export function shouldShowPriceFrom(p: StoreProduct): boolean {
  const vs = p.variants ?? [];
  const sz = p.sizeOptions ?? [];
  if (vs.length === 0 && sz.length === 0) return false;
  const vIter: (StoreProductVariant | null)[] = vs.length > 0 ? vs : [null];
  const sIter: (StoreSizeOption | null)[] = sz.length > 0 ? sz : [null];
  const prices = new Set<number>();
  for (const v of vIter) {
    for (const s of sIter) {
      prices.add(linePriceCents(p, s, v));
    }
  }
  return prices.size > 1;
}

/** When no size dimension, same as `linePriceCents(product, null, variant)`. */
export function effectiveVariantPriceCents(
  product: StoreProduct,
  variant: StoreProductVariant,
): number {
  return linePriceCents(product, null, variant);
}

/** MRP to display struck through, or null (omit when empty or not above selling price). */
export function mrpToShowCents(
  p: StoreProduct,
  finalPriceCents: number,
): number | null {
  const m = p.mrpCents;
  if (m == null) return null;
  if (m <= finalPriceCents) return null;
  return m;
}

function waistSizes(prefix: string): StoreSizeOption[] {
  return ["28", "30", "32", "34", "36"].map((label) => ({
    id: `${prefix}-w${label}`,
    label,
    priceCents: null,
  }));
}

function letterSizes(prefix: string): StoreSizeOption[] {
  return ["S", "M", "L", "XL", "XXL"].map((label) => ({
    id: `${prefix}-${label.replace(/[^A-Z0-9]/gi, "")}`,
    label,
    priceCents: null,
  }));
}

function matrixStock(
  variantIds: string[],
  sizeIds: string[],
  qty: number,
): Record<string, number> {
  const o: Record<string, number> = {};
  for (const v of variantIds) {
    for (const s of sizeIds) {
      o[stockPairKey(v, s)] = qty;
    }
  }
  return o;
}

const IMG = {
  teeBlack:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  teeWhite:
    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80",
  teeNavy:
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3103?w=800&q=80",
  graphic: "https://images.unsplash.com/photo-1618354691371-d3a82f7f6c8e?w=800&q=80",
  sand: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80",
  hoodieGrey:
    "https://images.unsplash.com/photo-1622445275576-360f27cfa9f3?w=800&q=80",
  hoodieBlack:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
} as const;

/**
 * **Demo product** for PDP layout: 3 colours with different prices + letter sizes +
 * per-cell stock (including some OOS) so you can verify the grid and pricing.
 */
const layoutShowcaseTee: StoreProduct = (() => {
  const id = "mock-layout";
  const sizes = letterSizes("ls");
  const sids = sizes.map((s) => s.id);
  const vBlack = {
    id: `${id}-blk`,
    label: "Black",
    imageUrl: IMG.teeBlack,
    priceCents: 129900,
  };
  const vWhite = {
    id: `${id}-wht`,
    label: "White",
    imageUrl: IMG.teeWhite,
    priceCents: 139900,
  };
  const vNavy = {
    id: `${id}-nvy`,
    label: "Navy",
    imageUrl: IMG.teeNavy,
    priceCents: 119900,
  };
  const stock: Record<string, number> = {};
  for (const v of [vBlack, vWhite, vNavy]) {
    for (const sid of sids) {
      stock[stockPairKey(v.id, sid)] = 8;
    }
  }
  // Demo OOS: White / L, Navy / S
  stock[stockPairKey(vWhite.id, sizes.find((x) => x.label === "L")!.id)] = 0;
  stock[stockPairKey(vNavy.id, sizes.find((x) => x.label === "S")!.id)] = 0;
  return {
    id,
    slug: "layout-showcase-tee",
    categorySlug: "tshirts",
    name: "Layout showcase tee",
    description:
      "Demo listing: three colourways with different prices, letter sizes, and a stock matrix (see White in L and Navy in S as out of stock).",
    priceCents: 129900,
    currency: "INR",
    imageUrl: IMG.teeBlack,
    sizeOptions: sizes,
    variants: [vBlack, vWhite, vNavy],
    stockByPair: stock,
  };
})();

export const MOCK_PRODUCTS: StoreProduct[] = [
  layoutShowcaseTee,
  {
    id: "mock-1",
    slug: "slim-chinos",
    categorySlug: "trousers",
    name: "Slim chinos",
    description:
      "Cotton twill, slim leg. Office-to-weekend neutral that holds its crease.",
    priceCents: 289900,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
    sizeOptions: waistSizes("m1"),
    variants: [
      {
        id: "m1-v1",
        label: "Khaki",
        imageUrl:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m1-v1"],
      waistSizes("m1").map((s) => s.id),
      12,
    ),
  },
  {
    id: "mock-2",
    slug: "relaxed-joggers",
    categorySlug: "trousers",
    name: "Relaxed joggers",
    description:
      "Tapered leg, soft fleece interior. Drawcord waist, zip side pockets.",
    priceCents: 219900,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78e?w=800&q=80",
    sizeOptions: waistSizes("m2"),
    variants: [
      {
        id: "m2-v1",
        label: "Heather",
        imageUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78e?w=800&q=80",
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m2-v1"],
      waistSizes("m2").map((s) => s.id),
      10,
    ),
  },
  {
    id: "mock-3",
    slug: "tapered-cargo",
    categorySlug: "trousers",
    name: "Tapered cargo",
    description:
      "Utility pockets, articulated knees. Durable cotton blend, washed black.",
    priceCents: 349900,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
    sizeOptions: waistSizes("m3"),
    variants: [
      {
        id: "m3-v1",
        label: "Washed black",
        imageUrl:
          "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m3-v1"],
      waistSizes("m3").map((s) => s.id),
      6,
    ),
  },
  {
    id: "mock-4",
    slug: "straight-jeans",
    categorySlug: "trousers",
    name: "Straight jeans",
    description:
      "Indigo stretch denim, straight fit. Contrast stitch, antique brass hardware.",
    priceCents: 329900,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1542272604-787c353553e8?w=800&q=80",
    sizeOptions: waistSizes("m4"),
    variants: [
      {
        id: "m4-v1",
        label: "Indigo",
        imageUrl:
          "https://images.unsplash.com/photo-1542272604-787c353553e8?w=800&q=80",
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m4-v1"],
      waistSizes("m4").map((s) => s.id),
      14,
    ),
  },
  {
    id: "mock-5",
    slug: "essential-crew-tee",
    categorySlug: "tshirts",
    name: "Essential crew tee",
    description:
      "180gsm organic cotton, ribbed collar. Preshrunk, soft hand feel.",
    priceCents: 129900,
    currency: "INR",
    imageUrl: IMG.teeBlack,
    sizeOptions: letterSizes("m5"),
    variants: [
      {
        id: "m5-blk",
        label: "Black",
        imageUrl: IMG.teeBlack,
        priceCents: 129900,
      },
      {
        id: "m5-wht",
        label: "White",
        imageUrl: IMG.teeWhite,
        priceCents: 129900,
      },
      {
        id: "m5-nvy",
        label: "Navy",
        imageUrl: IMG.teeNavy,
        priceCents: 124900,
      },
    ],
    stockByPair: matrixStock(
      ["m5-blk", "m5-wht", "m5-nvy"],
      letterSizes("m5").map((s) => s.id),
      20,
    ),
  },
  {
    id: "mock-6",
    slug: "graphic-street-tee",
    categorySlug: "tshirts",
    name: "Graphic street tee",
    description: "Oversize screen print on heavyweight cotton. Drop shoulder.",
    priceCents: 179900,
    currency: "INR",
    imageUrl: IMG.graphic,
    sizeOptions: letterSizes("m6"),
    variants: [
      {
        id: "m6-ink",
        label: "Ink black",
        imageUrl: IMG.graphic,
        priceCents: null,
      },
      { id: "m6-sand", label: "Sand", imageUrl: IMG.sand, priceCents: 189900 },
    ],
    stockByPair: matrixStock(
      ["m6-ink", "m6-sand"],
      letterSizes("m6").map((s) => s.id),
      15,
    ),
  },
  {
    id: "mock-7",
    slug: "longsleeve-base-tee",
    categorySlug: "tshirts",
    name: "Long sleeve base tee",
    description: "Ribbed cuffs, layer-friendly slim fit. Midweight jersey.",
    priceCents: 159900,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
    sizeOptions: letterSizes("m7"),
    variants: [
      {
        id: "m7-v1",
        label: "Charcoal",
        imageUrl:
          "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m7-v1"],
      letterSizes("m7").map((s) => s.id),
      11,
    ),
  },
  {
    id: "mock-8",
    slug: "boxy-tee",
    categorySlug: "tshirts",
    name: "Boxy tee",
    description:
      "Short body, wide shoulder line. Garment-dyed, lived-in texture.",
    priceCents: 149900,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1583743814966-89362f0c9b0b?w=800&q=80",
    sizeOptions: letterSizes("m8"),
    variants: [
      {
        id: "m8-v1",
        label: "Olive",
        imageUrl:
          "https://images.unsplash.com/photo-1583743814966-89362f0c9b0b?w=800&q=80",
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m8-v1"],
      letterSizes("m8").map((s) => s.id),
      9,
    ),
  },
  {
    id: "mock-9",
    slug: "pullover-fleece-hoodie",
    categorySlug: "hoodies",
    name: "Pullover fleece hoodie",
    description:
      "Brushed back fleece, double-lined hood. Kangaroo pocket, dense drawcords.",
    priceCents: 279900,
    currency: "INR",
    imageUrl: IMG.hoodieGrey,
    sizeOptions: letterSizes("m9"),
    variants: [
      {
        id: "m9-gry",
        label: "Melange grey",
        imageUrl: IMG.hoodieGrey,
        priceCents: null,
      },
      {
        id: "m9-blk",
        label: "Black",
        imageUrl: IMG.hoodieBlack,
        priceCents: 299900,
      },
    ],
    stockByPair: matrixStock(
      ["m9-gry", "m9-blk"],
      letterSizes("m9").map((s) => s.id),
      7,
    ),
  },
  {
    id: "mock-10",
    slug: "zip-fleece-hoodie",
    categorySlug: "hoodies",
    name: "Zip fleece hoodie",
    description: "Full zip, raglan sleeve. YKK metal zip, deep split pockets.",
    priceCents: 299900,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1620799140408-3eaddc8a6d6e?w=800&q=80",
    sizeOptions: letterSizes("m10"),
    variants: [
      {
        id: "m10-v1",
        label: "Slate",
        imageUrl:
          "https://images.unsplash.com/photo-1620799140408-3eaddc8a6d6e?w=800&q=80",
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m10-v1"],
      letterSizes("m10").map((s) => s.id),
      8,
    ),
  },
  {
    id: "mock-11",
    slug: "cropped-hoodie",
    categorySlug: "hoodies",
    name: "Cropped hoodie",
    description: "Ribbed hem hits high hip. Fleece interior, raw edge detail.",
    priceCents: 249900,
    currency: "INR",
    imageUrl: IMG.hoodieBlack,
    sizeOptions: letterSizes("m11"),
    variants: [
      {
        id: "m11-v1",
        label: "Plum",
        imageUrl: IMG.hoodieBlack,
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m11-v1"],
      letterSizes("m11").map((s) => s.id),
      10,
    ),
  },
  {
    id: "mock-12",
    slug: "heavyweight-pullover",
    categorySlug: "hoodies",
    name: "Heavyweight pullover",
    description:
      "400gsm fleece, dropped shoulder. Built for cold mornings and late nights.",
    priceCents: 359900,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
    sizeOptions: letterSizes("m12"),
    variants: [
      {
        id: "m12-v1",
        label: "Forest",
        imageUrl:
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
        priceCents: null,
      },
    ],
    stockByPair: matrixStock(
      ["m12-v1"],
      letterSizes("m12").map((s) => s.id),
      5,
    ),
  },
];

export function getMockProducts(): StoreProduct[] {
  return [...MOCK_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name));
}

export function getMockProductBySlug(slug: string): StoreProduct | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug);
}

export function getFeaturedMockProducts(count: number): StoreProduct[] {
  return MOCK_PRODUCTS.slice(0, count);
}
