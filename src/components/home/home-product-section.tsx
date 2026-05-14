import Link from "next/link";
import {
  listFromPriceCents,
  shouldShowPriceFrom,
  type StoreProduct,
} from "@/data/mock-products";
import { StorefrontProductPrice } from "@/components/storefront/StorefrontProductPrice";
import { ClothingProductCard } from "./clothing-product-card";

type Props = {
  title: string;
  products: StoreProduct[];
  page: number;
  totalPages: number;
  /** Streetwear / reference layout: 2-col grid, no blur header link, bar CTA. */
  clothingLayout?: boolean;
};

export function HomeProductSection({
  title,
  products,
  page,
  totalPages,
  clothingLayout = false,
}: Props) {
  if (clothingLayout) {
    return (
      <section className="mx-auto max-w-7xl border-b border-black/5 bg-white px-4 pb-12 pt-2 sm:px-6 sm:pb-16 lg:px-8">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">{title}</h2>

        {products.length === 0 ? (
          <p className="mt-8 text-sm text-neutral-500">No products to show yet.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-8 md:max-w-4xl">
            {products.map((p, i) => (
              <li key={p.id} className="min-w-0">
                <ClothingProductCard product={p} index={i} />
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav
            className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-500"
            aria-label="Product pages"
          >
            {page > 1 ? (
              <Link
                href={page === 2 ? "/" : `/?page=${page - 1}`}
                className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-neutral-800 transition hover:border-neutral-300"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-md border border-transparent px-4 py-2 text-neutral-300">Previous</span>
            )}
            <span className="px-2 tabular-nums text-neutral-600">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/?page=${page + 1}`}
                className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-neutral-800 transition hover:border-neutral-300"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-md border border-transparent px-4 py-2 text-neutral-300">Next</span>
            )}
          </nav>
        ) : null}

        {products.length > 0 ? (
          <div className="mx-auto mt-8 max-w-md sm:mt-10">
            <Link
              href="/products"
              className="block w-full rounded-md bg-black py-3.5 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              View all
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-2 sm:px-6 sm:pb-28 sm:pt-4 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:mb-2 sm:flex-row sm:items-end sm:gap-6">
        <div className="min-w-0">
          <h2 className="text-[1.75rem] font-bold leading-[1.15] tracking-tight text-neutral-900 sm:text-3xl md:text-4xl dark:text-neutral-50">
            {title}
          </h2>
        </div>
        <Link
          href="/products"
          className="group inline-flex w-fit shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <span>View all</span>
          <span
            className="inline-block transition duration-200 group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-sm text-neutral-500 dark:text-neutral-400">
          No products to show yet.
        </p>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-3 lg:gap-y-20">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.slug}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-neutral-500/40 dark:focus-visible:ring-offset-stone-950"
              >
                <div className="overflow-hidden rounded-lg bg-neutral-100 shadow-sm ring-1 ring-black/5 transition duration-500 group-hover:shadow-md group-hover:ring-black/10 dark:bg-neutral-800/80">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="aspect-[4/5] h-full w-full object-cover transition duration-500 ease-out will-change-transform group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="aspect-[4/5] w-full bg-neutral-200/80 dark:bg-neutral-700/50" />
                  )}
                </div>
                <div className="mt-5 space-y-1.5">
                  <p className="text-[1.05rem] font-medium leading-snug tracking-tight text-neutral-900 dark:text-neutral-100">
                    {p.name}
                  </p>
                  <p className="text-[0.95rem] tabular-nums tracking-tight text-neutral-500 dark:text-neutral-400">
                    <StorefrontProductPrice
                      product={p}
                      finalCents={listFromPriceCents(p)}
                      showFrom={shouldShowPriceFrom(p)}
                      variant="home"
                    />
                  </p>
                  {p.description ? (
                    <p className="line-clamp-2 pt-1 text-[0.8125rem] leading-relaxed text-neutral-500 dark:text-neutral-500">
                      {p.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav
          className="mt-16 flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
          aria-label="Product pages"
        >
          {page > 1 ? (
            <Link
              href={page === 2 ? "/" : `/?page=${page - 1}`}
              className="rounded-md border border-neutral-200/90 bg-white px-5 py-2.5 text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/80"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-md border border-transparent px-5 py-2.5 text-neutral-300 dark:text-neutral-600">
              Previous
            </span>
          )}
          <span className="px-2 tabular-nums text-neutral-600 dark:text-neutral-300">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/?page=${page + 1}`}
              className="rounded-md border border-neutral-200/90 bg-white px-5 py-2.5 text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/80"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-transparent px-5 py-2.5 text-neutral-300 dark:text-neutral-600">
              Next
            </span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
