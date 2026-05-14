import Link from "next/link";
import { ClothingProductCard } from "@/components/home/clothing-product-card";
import { getCatalogProducts } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { sf } from "@/lib/storefront-ui";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ category?: string }> };

async function categoryTitle(slug: string | undefined): Promise<string | null> {
  if (!slug) return null;
  try {
    const c = await prisma.category.findUnique({
      where: { slug },
      select: { name: true },
    });
    return c?.name ?? null;
  } catch {
    return null;
  }
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category: categorySlug } = await searchParams;
  const products = await getCatalogProducts(categorySlug);
  const label = categorySlug
    ? (await categoryTitle(categorySlug)) ?? categorySlug
    : null;

  return (
    <div className={sf.page}>
      <nav className={sf.crNav}>
        <Link href="/" className={sf.crLink}>
          Home
        </Link>
        <span className={`mx-2 ${sf.crSep}`}>/</span>
        <span className={sf.crCurrent}>Products</span>
      </nav>

      <h1 className={`${sf.h1Lg} mt-8`}>{label ? label : "All products"}</h1>
      <p className={`${sf.body} mt-3 max-w-lg text-sm sm:text-base`}>
        {label
          ? "Browse this category."
          : "Every piece, curated for the shop."}
      </p>

      {categorySlug ? (
        <p className="mt-4">
          <Link href="/products" className={sf.linkMuted}>
            Show all products
          </Link>
        </p>
      ) : null}

      {products.length === 0 ? (
        <p className={`${sf.sub} mt-12`}>
          No products in this list yet.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3">
          {products.map((p, i) => (
            <li key={p.id} className="min-w-0">
              <ClothingProductCard product={p} index={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
