"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatMoney } from "@/lib/format";
import { formatCartLineOptions } from "@/lib/product-options";
import { sf } from "@/lib/storefront-ui";

export default function CartPage() {
  const {
    lines,
    ready,
    removeLine,
    setQuantity,
    subtotalCents,
    discountCents,
    totalCents,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponRevalidating,
  } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const currency = lines[0]?.currency ?? "INR";

  if (!ready) {
    return (
      <div className={sf.page}>
        <p className={`${sf.sub} py-32 text-center`}>
          Loading your bag…
        </p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className={`${sf.page} text-center`}>
        <h1 className={sf.h1Lg}>Your bag is empty</h1>
        <p className={`${sf.body} mt-3`}>
          When you add items, they will appear here.
        </p>
        <Link
          href="/products"
          className={`${sf.btnBlack} mt-10`}
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={sf.page}>
      <h1 className={sf.h1Lg}>Bag</h1>
      <p className={`${sf.sub} mt-1`}>
        {lines.length} {lines.length === 1 ? "item" : "items"}
      </p>

      <div className="mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-14">
        <ul className="lg:col-span-7">
          {lines.map((line, i) => {
            const lineMeta = formatCartLineOptions(line);
            return (
            <li
              key={line.lineId}
              className={
                i === 0
                  ? "border-t border-black/10 pt-6 dark:border-white/10"
                  : "mt-6 border-t border-black/10 pt-6 dark:border-white/10"
              }
            >
              <div className="flex gap-3 sm:gap-5">
                <Link
                  href={`/products/${line.slug}`}
                  className="h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-black/5 dark:bg-neutral-800 sm:h-32 sm:w-28"
                >
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${line.slug}`}
                    className="text-[1.02rem] font-medium tracking-tight text-neutral-900 transition hover:opacity-80 dark:text-neutral-100"
                  >
                    {line.name}
                  </Link>
                  {lineMeta ? (
                    <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                      {lineMeta}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {formatMoney(line.priceCents, line.currency)} each
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="inline-flex items-stretch overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-600 dark:bg-neutral-800/90">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            line.lineId,
                            Math.max(1, line.quantity - 1),
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-700/80"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="flex min-w-[2.25rem] items-center justify-center border-x border-neutral-200 text-sm tabular-nums text-neutral-900 dark:border-neutral-600 dark:text-neutral-100">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(line.lineId, line.quantity + 1)
                        }
                        className="flex h-9 w-9 items-center justify-center text-neutral-600 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700/80"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.lineId)}
                      className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-base font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatMoney(line.priceCents * line.quantity, line.currency)}
                </p>
              </div>
            </li>
            );
          })}
        </ul>

        <aside className={`${sf.card} mt-8 p-5 sm:p-6 lg:col-span-5 lg:mt-0 lg:sticky lg:top-28`}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
            Summary
          </h2>

          <div className="mt-4">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Coupon
            </label>
            {appliedCoupon ? (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-neutral-800 dark:text-neutral-200">
                  <span className="font-mono text-[0.9rem] font-semibold tracking-wide">
                    {appliedCoupon.code}
                  </span>
                  {couponRevalidating ? (
                    <span className="ml-2 text-xs text-neutral-500">Updating…</span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCouponError(null);
                    removeCoupon();
                    setCouponInput("");
                  }}
                  className="self-start text-sm font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void (async () => {
                        if (applyLoading) return;
                        setApplyLoading(true);
                        setCouponError(null);
                        const r = await applyCoupon(couponInput);
                        setApplyLoading(false);
                        if (!r.ok) setCouponError(r.error);
                        else setCouponInput("");
                      })();
                    }
                  }}
                  placeholder="Code"
                  autoCapitalize="characters"
                  className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/20 dark:border-neutral-600 dark:bg-neutral-800/90 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
                <button
                  type="button"
                  disabled={applyLoading}
                  onClick={async () => {
                    if (applyLoading) return;
                    setApplyLoading(true);
                    setCouponError(null);
                    const r = await applyCoupon(couponInput);
                    setApplyLoading(false);
                    if (!r.ok) setCouponError(r.error);
                    else setCouponInput("");
                  }}
                  className="h-10 shrink-0 rounded-md border border-neutral-300 bg-neutral-50 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-100 dark:hover:bg-neutral-800"
                >
                  {applyLoading ? "…" : "Apply"}
                </button>
              </div>
            )}
            {couponError ? (
              <p className="mt-2 border-l-2 border-neutral-900 pl-2 text-sm text-neutral-900 dark:border-neutral-100 dark:text-neutral-100">
                {couponError}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
            <span className="text-lg font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatMoney(subtotalCents, currency)}
            </span>
          </div>
          {discountCents > 0 ? (
            <div className="mt-2 flex items-baseline justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">
                Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ""}
              </span>
              <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                −{formatMoney(discountCents, currency)}
              </span>
            </div>
          ) : null}
          <div className="mt-3 flex items-baseline justify-between border-t border-black/5 pt-3 dark:border-white/10">
            <span className="text-base font-medium text-neutral-800 dark:text-neutral-200">
              Total
            </span>
            <span className="text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatMoney(totalCents, currency)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-500">
            Shipping and tax are calculated at checkout.
          </p>
          <Link
            href="/checkout"
            className={`${sf.btnBlackFull} mt-5`}
          >
            Check out
          </Link>
          <Link
            href="/products"
            className={`${sf.linkMuted} mt-3 block w-full text-center`}
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
