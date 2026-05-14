"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiBars3, HiXMark } from "react-icons/hi2";
import { siteConfig } from "@/config";
import { CartNavLink } from "@/components/cart/cart-nav-link";

type Props = {
  shopNameFontStack?: string | null;
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/products", label: "All products" },
  { href: "/orders", label: "Order status" },
  { href: "/cart", label: "Bag" },
] as const;

export function ClothingHeader({ shopNameFontStack }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <div className="mx-auto grid h-12 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 sm:h-14 sm:px-6 lg:px-8">
          <div className="flex min-w-0 justify-start">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-900 transition hover:bg-black/5"
              aria-label="Open menu"
            >
              <HiBars3 className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
          <Link
            href="/"
            className="justify-self-center text-center text-[1.05rem] font-bold leading-none tracking-tight text-neutral-900 sm:text-lg"
            style={shopNameFontStack ? { fontFamily: shopNameFontStack } : undefined}
            onClick={() => setOpen(false)}
          >
            {siteConfig.name}
          </Link>
          <div className="flex min-w-0 items-center justify-end">
            <CartNavLink iconOnly />
          </div>
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative flex h-full max-w-sm flex-col bg-white shadow-xl">
            <div className="flex h-12 items-center justify-between border-b border-black/10 px-4 sm:h-14">
              <span className="text-sm font-semibold text-neutral-900">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 transition hover:bg-black/5"
                aria-label="Close menu"
              >
                <HiXMark className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Main">
              <ul className="space-y-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-4 py-3 text-base font-medium text-neutral-900 transition hover:bg-neutral-100"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
