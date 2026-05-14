import { mrpToShowCents, type StoreProduct } from "@/data/mock-products";
import { formatMoney } from "@/lib/format";

type Variant = "card" | "home" | "pdp";

const mrpClass: Record<Variant, string> = {
  card: "text-sm tabular-nums line-through text-neutral-500 dark:text-neutral-500",
  home: "text-[0.95rem] tabular-nums line-through text-neutral-500 dark:text-neutral-500",
  pdp: "text-lg font-medium tabular-nums line-through text-neutral-500 dark:text-neutral-500 sm:text-xl",
};

const fromClass: Record<Variant, string> = {
  card: "text-xs font-medium text-neutral-500",
  home: "text-xs font-medium text-neutral-500 dark:text-neutral-500",
  pdp: "text-xs font-medium text-neutral-500 dark:text-neutral-500",
};

const finalClass: Record<Variant, string> = {
  card: "text-sm tabular-nums tracking-tight text-neutral-600",
  home: "text-[0.95rem] tabular-nums tracking-tight text-neutral-900",
  pdp: "text-2xl font-bold tabular-nums tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50",
};

type Props = {
  product: StoreProduct;
  finalCents: number;
  showFrom?: boolean;
  variant: Variant;
};

/**
 * MRP (struck through) + optional "From" + final price, when MRP is set and above final.
 */
export function StorefrontProductPrice({
  product,
  finalCents,
  showFrom = false,
  variant,
}: Props) {
  const mrp = mrpToShowCents(product, finalCents);
  const c = product.currency;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      {mrp != null ? (
        <span className={mrpClass[variant]}>{formatMoney(mrp, c)}</span>
      ) : null}
      <span className="inline-flex items-baseline gap-x-1.5">
        {showFrom ? <span className={fromClass[variant]}>From</span> : null}
        <span className={finalClass[variant]}>
          {formatMoney(finalCents, c)}
        </span>
      </span>
    </span>
  );
}
