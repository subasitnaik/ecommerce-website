"use client";

import Link from "next/link";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { useCart } from "./cart-context";

type NavProps = { iconOnly?: boolean };

export function CartNavLink({ iconOnly = false }: NavProps) {
  const { itemCount, ready } = useCart();
  const count = ready ? itemCount : 0;

  return (
    <Link
      href="/cart"
      className="group relative flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-neutral-900 transition hover:bg-black/5 hover:text-neutral-900"
      aria-label={count > 0 ? `Bag, ${count} items` : "Bag"}
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center">
        <HiOutlineShoppingBag
          className="h-6 w-6 shrink-0 text-neutral-900"
          strokeWidth={1.75}
          aria-hidden
        />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold leading-none text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
      {iconOnly ? null : <span className="hidden sm:inline sm:pl-0.5">Bag</span>}
    </Link>
  );
}
