import {
  listFromPriceCents,
  MOCK_PRODUCTS,
  stockPairKey,
  type StoreProduct,
} from "@/data/mock-products";
import {
  HOME_CATEGORY_DEFINITIONS,
  MOCK_HOME_CATEGORIES,
} from "@/data/mock-categories";
import type { HomeAboveProductsHighlight, StoreCategory } from "@/types/home";
import {
  getMockReviewsForSlug,
  type StoreReview,
} from "@/data/mock-reviews";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type { StoreReview };

export type AdminProductRow = {
  id: string;
  slug: string;
  product: { name: string; imageUrl: string };
  sku: string;
  status: "In stock" | "Out of stock";
  price: string;
};

export type AdminReviewRow = {
  id: string;
  user: { name: string };
  rating: number;
  product: string;
  productSlug: string;
  lastLogin: string;
};

export const productCatalogInclude = {
  sizes: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: { sortOrder: "asc" as const } },
  stocks: true,
} as const;

function mapProductDb(
  p: {
    id: string;
    slug: string;
    name: string;
    description: string;
    priceCents: number;
    mrpCents: number | null;
    currency: string;
    imageUrl: string | null;
    active: boolean;
    sizes: { id: string; label: string; priceCents: number | null; sortOrder: number }[];
    variants: {
      id: string;
      label: string;
      imageUrl: string | null;
      imageUrl2: string | null;
      imageUrl3: string | null;
      priceCents: number | null;
      sortOrder: number;
    }[];
    stocks: {
      variantId: string;
      sizeId: string;
      quantity: number;
      notOffered: boolean;
    }[];
  },
): StoreProduct {
  const stockByPair: Record<string, number> = {};
  const notOfferedByPair: Record<string, true> = {};
  for (const s of p.stocks) {
    stockByPair[stockPairKey(s.variantId, s.sizeId)] = s.quantity;
    if (s.notOffered) {
      notOfferedByPair[stockPairKey(s.variantId, s.sizeId)] = true;
    }
  }
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    mrpCents: p.mrpCents,
    currency: p.currency,
    imageUrl: p.imageUrl,
    sizeOptions: p.sizes.map((x) => ({
      id: x.id,
      label: x.label,
      priceCents: x.priceCents,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      imageUrl: v.imageUrl,
      imageUrl2: v.imageUrl2,
      imageUrl3: v.imageUrl3,
      priceCents: v.priceCents,
    })),
    stockByPair: p.stocks.length > 0 ? stockByPair : undefined,
    notOfferedByPair:
      Object.keys(notOfferedByPair).length > 0 ? notOfferedByPair : undefined,
  };
}

const PLACEHOLDER_IMG = "/admin-assets/phone 1.jpg";

function mockProductsToAdminRows(): AdminProductRow[] {
  return MOCK_PRODUCTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    product: {
      name: p.name,
      imageUrl: p.imageUrl || PLACEHOLDER_IMG,
    },
    sku: p.id.replace(/^mock-/, "MOCK-").toUpperCase().slice(0, 12),
    status: "In stock" as const,
    price: formatMoney(listFromPriceCents(p), p.currency),
  }));
}

/** Active products for the storefront — DB when available, else mock file. */
export async function getCatalogProducts(
  categorySlug?: string,
): Promise<StoreProduct[]> {
  try {
    const rows = await prisma.product.findMany({
      where: {
        active: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      orderBy: { name: "asc" },
      include: productCatalogInclude,
    });
    if (rows.length === 0) return getMockProductsSorted(categorySlug);
    return rows.map(mapProductDb);
  } catch {
    return getMockProductsSorted(categorySlug);
  }
}

function getMockProductsSorted(categorySlug?: string): StoreProduct[] {
  let list = [...MOCK_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name));
  if (categorySlug) {
    list = list.filter((p) => p.categorySlug === categorySlug);
  }
  return list;
}

export async function getCatalogProductBySlug(
  slug: string,
): Promise<StoreProduct | undefined> {
  try {
    const p = await prisma.product.findFirst({
      where: { slug, active: true },
      include: productCatalogInclude,
    });
    if (p) return mapProductDb(p);
  } catch {
    /* mock */
  }
  return MOCK_PRODUCTS.find((x) => x.slug === slug);
}

export async function getFeaturedCatalogProducts(
  count: number,
): Promise<StoreProduct[]> {
  const all = await getCatalogProducts();
  return all.slice(0, Math.max(0, count));
}

export async function getHomeCategories(): Promise<StoreCategory[]> {
  try {
    const rows = await prisma.category.findMany({
      where: { showOnHome: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
      select: { id: true, name: true, slug: true, imageUrl: true },
    });
    if (rows.length > 0) return rows;
    return MOCK_HOME_CATEGORIES.slice(0, 5);
  } catch {
    return MOCK_HOME_CATEGORIES.slice(0, 5);
  }
}

export async function getAllProductsPaginatedForHome(opts: {
  page: number;
  perPage: number;
}): Promise<{ products: StoreProduct[]; total: number; totalPages: number }> {
  const per = Math.min(24, Math.max(3, opts.perPage));
  const page = Math.max(1, opts.page);
  const skip = (page - 1) * per;

  try {
    const baseWhere = { active: true as const };
    const total = await prisma.product.count({ where: baseWhere });
    const totalPages = Math.max(1, Math.ceil(total / per));
    const rows = await prisma.product.findMany({
      where: baseWhere,
      orderBy: { name: "asc" },
      skip,
      take: per,
      include: productCatalogInclude,
    });
    return { products: rows.map(mapProductDb), total, totalPages };
  } catch {
    return getAllProductsPaginatedForHomeMock(opts);
  }
}

function getAllProductsPaginatedForHomeMock(opts: {
  page: number;
  perPage: number;
}): { products: StoreProduct[]; total: number; totalPages: number } {
  const per = Math.min(24, Math.max(3, opts.perPage));
  const page = Math.max(1, opts.page);
  const list = [...MOCK_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / per));
  const skip = (page - 1) * per;
  const products = list.slice(skip, skip + per);
  return { products, total, totalPages };
}

const HOME_ABOVE_RAIL_MAX = 24;

/** Horizontal rail above “All products” — admin picks bestsellers vs a category. */
export async function getHomeAboveProductsRail(opts: {
  highlight: HomeAboveProductsHighlight;
  take?: number;
}): Promise<{ products: StoreProduct[]; heading: string }> {
  const take = Math.min(HOME_ABOVE_RAIL_MAX, Math.max(1, opts.take ?? 8));

  try {
    const baseWhere = { active: true as const };

    if (opts.highlight.kind === "bestsellers") {
      const featuredWhere = { ...baseWhere, featured: true };
      const featuredCount = await prisma.product.count({ where: featuredWhere });
      const rows =
        featuredCount > 0
          ? await prisma.product.findMany({
              where: featuredWhere,
              orderBy: { updatedAt: "desc" },
              take,
              include: productCatalogInclude,
            })
          : await prisma.product.findMany({
              where: baseWhere,
              orderBy: { createdAt: "desc" },
              take,
              include: productCatalogInclude,
            });
      return {
        products: rows.map(mapProductDb),
        heading: "Best sellers",
      };
    }

    const slug = opts.highlight.slug;
    const cat = await prisma.category.findUnique({
      where: { slug },
      select: { name: true },
    });
    const rows = await prisma.product.findMany({
      where: { ...baseWhere, category: { slug } },
      orderBy: { name: "asc" },
      take,
      include: productCatalogInclude,
    });
    return {
      products: rows.map(mapProductDb),
      heading: cat?.name ?? slug,
    };
  } catch {
    return getHomeAboveProductsRailMock(opts.highlight, take);
  }
}

function getHomeAboveProductsRailMock(
  highlight: HomeAboveProductsHighlight,
  take: number,
): { products: StoreProduct[]; heading: string } {
  if (highlight.kind === "bestsellers") {
    const products = MOCK_PRODUCTS.slice(0, take);
    return { products, heading: "Best sellers" };
  }
  const slug = highlight.slug;
  const cat = HOME_CATEGORY_DEFINITIONS.find((c) => c.slug === slug);
  const list = MOCK_PRODUCTS.filter((p) => p.categorySlug === slug).sort(
    (a, b) => a.name.localeCompare(b.name),
  );
  return {
    products: list.slice(0, take),
    heading: cat?.name ?? slug,
  };
}

export async function getHomeAboveProductsRails(opts: {
  highlights: HomeAboveProductsHighlight[];
  take?: number;
}): Promise<{ heading: string; products: StoreProduct[] }[]> {
  const take = opts.take ?? 8;
  return Promise.all(
    opts.highlights.map((highlight) =>
      getHomeAboveProductsRail({ highlight, take }),
    ),
  );
}

/** Admin products table — same catalog as storefront. */
export async function getCatalogProductsForAdmin(): Promise<AdminProductRow[]> {
  try {
    const rows = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: productCatalogInclude,
    });
    if (rows.length === 0) return mockProductsToAdminRows();
    return rows.map((p) => {
      const m = mapProductDb(p);
      return {
        id: p.id,
        slug: p.slug,
        product: {
          name: p.name,
          imageUrl: p.imageUrl || PLACEHOLDER_IMG,
        },
        sku: p.id.replace(/-/g, "").slice(0, 12).toUpperCase(),
        status: p.active ? "In stock" : "Out of stock",
        price: formatMoney(listFromPriceCents(m), p.currency),
      };
    });
  } catch {
    return mockProductsToAdminRows();
  }
}

/** Reviews for a product PDP — DB first, then mock file for demos without DB. */
export async function getReviewsForProductSlug(
  slug: string,
): Promise<StoreReview[]> {
  try {
    const product = await prisma.product.findFirst({ where: { slug } });
    if (!product) return getMockReviewsForSlug(slug);
    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
    });
    if (reviews.length > 0) {
      return reviews.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        imageUrls: r.imageUrls?.length ? [...r.imageUrls] : undefined,
      }));
    }
    return getMockReviewsForSlug(slug);
  } catch {
    return getMockReviewsForSlug(slug);
  }
}

/** Admin reviews table — aligned with storefront product names/slugs. */
export async function getReviewsForAdmin(): Promise<AdminReviewRow[]> {
  try {
    const reviews = await prisma.review.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (reviews.length > 0) {
      return reviews.map((r) => ({
        id: r.id,
        user: {
          name: r.authorName,
        },
        rating: r.rating,
        product: r.product.name,
        productSlug: r.product.slug,
        lastLogin: r.createdAt.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      }));
    }
  } catch {
    /* mock below */
  }
  return getMockReviewsForAdmin();
}

function getMockReviewsForAdmin(): AdminReviewRow[] {
  return MOCK_PRODUCTS.flatMap((p) =>
    getMockReviewsForSlug(p.slug).map((r) => ({
      id: r.id,
      user: {
        name: r.authorName,
      },
      rating: r.rating,
      product: p.name,
      productSlug: p.slug,
      lastLogin: r.createdAt.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    })),
  );
}

/** Admin “All categories” list — matches Prisma Category + product counts. */
export type AdminCategoryRow = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  productCount: number;
};

/** Demo rows for /admin/categories when the DB has no categories (or DB is offline). */
function getMockAdminCategoriesForLayout(): AdminCategoryRow[] {
  const countBySlug = new Map<string, number>();
  for (const p of MOCK_PRODUCTS) {
    const s = p.categorySlug;
    if (!s) continue;
    countBySlug.set(s, (countBySlug.get(s) ?? 0) + 1);
  }

  return HOME_CATEGORY_DEFINITIONS.map((c) => ({
    id: `demo-cat-${c.slug}`,
    slug: c.slug,
    name: c.name,
    imageUrl: c.imageUrl,
    productCount: countBySlug.get(c.slug) ?? 0,
  }));
}

export async function getCatalogCategoriesForAdmin(): Promise<
  AdminCategoryRow[]
> {
  try {
    const rows = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        imageUrl: true,
        _count: { select: { products: true } },
      },
    });
    if (rows.length === 0) {
      return getMockAdminCategoriesForLayout();
    }
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      imageUrl: r.imageUrl,
      productCount: r._count.products,
    }));
  } catch {
    return getMockAdminCategoriesForLayout();
  }
}
