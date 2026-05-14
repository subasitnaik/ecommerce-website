import Link from "next/link";
import type { StoreCategory } from "@/types/home";

function Cat({ c }: { c: StoreCategory }) {
  return (
    <Link
      href={`/products?category=${encodeURIComponent(c.slug)}`}
      className="group flex w-[80px] shrink-0 flex-col items-center gap-2 sm:w-[88px]"
    >
      <div
        className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-black/5 transition group-hover:ring-black/10 sm:h-[72px] sm:w-[72px]"
        aria-hidden
      >
        {c.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neutral-600">
            {c.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-neutral-900 sm:text-xs">
        {c.name}
      </span>
    </Link>
  );
}

type Props = { categories: StoreCategory[] };

export function ClothingCategoryRail({ categories }: Props) {
  const list = categories.slice(0, 6);
  if (list.length === 0) return null;

  return (
    <section className="border-b border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">
          Shop by category
        </p>
        <nav
          className="mt-4 flex snap-x snap-mandatory justify-start gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-5 sm:justify-center sm:gap-5 [&::-webkit-scrollbar]:hidden"
          aria-label="Product categories"
        >
          {list.map((c) => (
            <div key={c.id} className="snap-start">
              <Cat c={c} />
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
}
