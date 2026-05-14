"use client";

import { useState } from "react";
import { useCart } from "./cart-context";

type Props = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
};

export function AddToCartButton({
  productId,
  slug,
  name,
  priceCents,
  currency,
  imageUrl,
}: Props) {
  const { addLine } = useCart();
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState(false);

  function add() {
    addLine({
      productId,
      slug,
      name,
      priceCents,
      currency,
      imageUrl,
      quantity: qty,
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  }

  function step(delta: number) {
    setQty((q) => Math.max(1, q + delta));
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-4">
      <div className="sm:flex-1 sm:min-w-[8rem]">
        <span
          className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
          id="qty-label"
        >
          Quantity
        </span>
        <div
          className="mt-2 flex h-11 max-w-[10rem] overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-600 dark:bg-neutral-800/50"
          role="group"
          aria-labelledby="qty-label"
        >
          <button
            type="button"
            onClick={() => step(-1)}
            className="flex-1 px-2 text-lg leading-none text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200/90 dark:text-neutral-200 dark:hover:bg-neutral-800"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="flex min-w-[2.75rem] flex-[0.7] items-center justify-center border-x border-neutral-200 text-sm font-semibold tabular-nums text-neutral-900 dark:border-neutral-600 dark:text-neutral-100">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => step(1)}
            className="flex-1 px-2 text-lg leading-none text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200/90 dark:text-neutral-200 dark:hover:bg-neutral-800"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex sm:items-end">
        <button
          type="button"
          onClick={add}
          className="h-11 min-w-[11rem] rounded-md bg-neutral-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:bg-neutral-900 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
        >
          {flash ? "Added to your bag" : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
