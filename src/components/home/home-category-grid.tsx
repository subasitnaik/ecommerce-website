import Link from "next/link";
import type { StoreCategory } from "@/types/home";

function CategoryCircle({ c }: { c: StoreCategory }) {
  return (
    <Link
      href={`/products?category=${encodeURIComponent(c.slug)}`}
      className="group flex w-[88px] shrink-0 flex-col items-center gap-2.5 sm:w-24"
    >
      <div
        className="relative h-[72px] w-[72px] overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200/90 shadow-sm transition duration-200 group-hover:ring-stone-300 group-hover:shadow-md dark:bg-stone-800 dark:ring-stone-600/90 dark:group-hover:ring-stone-500 sm:h-20 sm:w-20"
        aria-hidden
      >
        {c.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-lg font-semibold tracking-tight text-stone-600 dark:from-stone-700 dark:to-stone-800 dark:text-stone-300">
            {c.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <span className="line-clamp-2 text-center text-[13px] font-medium leading-snug text-stone-800 dark:text-stone-100 sm:text-sm">
        {c.name}
      </span>
    </Link>
  );
}

function AllCategoriesCircle() {
  return (
    <Link
      href="/products"
      className="group flex w-[88px] shrink-0 flex-col items-center gap-2.5 sm:w-24"
    >
      <div
        className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full border border-dashed border-stone-300 bg-stone-50/80 text-stone-500 ring-1 ring-stone-200/60 transition duration-200 group-hover:border-stone-400 group-hover:bg-stone-100 group-hover:text-stone-700 group-hover:ring-stone-300 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-400 dark:ring-stone-600/60 dark:group-hover:border-stone-500 dark:group-hover:bg-stone-700/80 dark:group-hover:text-stone-200 sm:h-20 sm:w-20"
        aria-hidden
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-200">
          All
        </span>
      </div>
      <span className="line-clamp-2 text-center text-[13px] font-medium leading-snug text-stone-700 dark:text-stone-100 sm:text-sm">
        All categories
      </span>
    </Link>
  );
}

export function HomeCategoryGrid({ categories }: { categories: StoreCategory[] }) {
  const list = categories.slice(0, 5);
  if (list.length === 0) return null;

  return (
    <section className="border-b border-stone-100 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
        <h2 className="text-center text-sm font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-stone-300">
          Shop by category
        </h2>
        <nav
          className="mt-8 flex flex-wrap items-start justify-center gap-x-6 gap-y-8 sm:gap-x-10 md:gap-x-12"
          aria-label="Product categories"
        >
          {list.map((c) => (
            <CategoryCircle key={c.id} c={c} />
          ))}
          <AllCategoriesCircle />
        </nav>
      </div>
    </section>
  );
}
