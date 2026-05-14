import Link from "next/link";
import {
  listFromPriceCents,
  shouldShowPriceFrom,
  type StoreProduct,
} from "@/data/mock-products";
import { StorefrontProductPrice } from "@/components/storefront/StorefrontProductPrice";

const plateBg = [
  "bg-neutral-200/90",
  "bg-neutral-300/70",
  "bg-stone-200/85",
  "bg-stone-300/75",
  "bg-neutral-100/95",
] as const;

function plateClass(i: number) {
  return plateBg[i % plateBg.length]!;
}

export function ClothingProductCard({ product: p, index = 0 }: { product: StoreProduct; index?: number }) {
  return (
    <Link
      href={`/products/${p.slug}`}
      className="group block min-w-0 max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
    >
      <div
        className={`overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5 transition group-hover:shadow-md ${plateClass(
          index
        )}`}
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt=""
            className="aspect-[4/5] h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="aspect-[4/5] w-full bg-neutral-200/80" />
        )}
      </div>
      <div className="mt-2.5 space-y-0.5 sm:mt-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-neutral-900">{p.name}</p>
        <p className="text-sm tabular-nums tracking-tight text-neutral-600">
          <StorefrontProductPrice
            product={p}
            finalCents={listFromPriceCents(p)}
            showFrom={shouldShowPriceFrom(p)}
            variant="card"
          />
        </p>
      </div>
    </Link>
  );
}
