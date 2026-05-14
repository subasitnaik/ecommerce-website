"use client";

import NextLink from "next/link";
import type { AdminCategoryRow } from "@/lib/catalog";
import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";
import { HiOutlinePencil } from "react-icons/hi";
import { HiOutlineTrash } from "react-icons/hi";
import { HiOutlineEye } from "react-icons/hi";

type Props = { items: AdminCategoryRow[] };

function Actions({ slug }: { slug: string }) {
  return (
    <div className="flex flex-shrink-0 flex-wrap gap-1">
      <Link
        to={`/categories/${slug}`}
        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
        title="Edit in admin"
      >
        <HiOutlinePencil className="text-lg" />
      </Link>
      <NextLink
        href="/products"
        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
        title="Browse shop"
      >
        <HiOutlineEye className="text-lg" />
      </NextLink>
      <Link
        to="#"
        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
        title="Delete (coming soon)"
      >
        <HiOutlineTrash className="text-lg" />
      </Link>
    </div>
  );
}

function countLabel(n: number): string {
  if (n === 1) return "1 product";
  return `${n} products`;
}

export default function CategoryTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-lg border border-dashed border-gray-500/60 px-4 py-10 text-center text-sm text-blackPrimary/70 dark:text-whiteSecondary/70 sm:mx-6 lg:mx-8">
        No categories yet. Use <strong>Add a category</strong> to create one.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-3 px-4 sm:px-6 lg:px-8">
      {items.map((item) => (
        <li key={item.id}>
          <div className="flex w-full min-w-0 overflow-hidden rounded-lg border border-gray-600/60 bg-whiteSecondary/90 shadow-sm dark:bg-blackPrimary/50">
            <div className="relative min-h-[7.5rem] w-28 flex-shrink-0 sm:min-h-[8.5rem] sm:w-36 md:w-44">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-neutral-200 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  aria-hidden
                >
                  No image
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-3 sm:flex-row sm:items-stretch sm:gap-4 sm:p-4">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-blackPrimary dark:text-whiteSecondary sm:text-base">
                  {item.name}
                </p>
                <p className="mt-1 font-mono text-xs text-blackPrimary/80 dark:text-whiteSecondary/80">
                  {item.slug}
                </p>
                <p className="mt-2 text-sm text-blackPrimary/90 dark:text-whiteSecondary/90">
                  {countLabel(item.productCount)}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-col gap-2 sm:items-end sm:justify-between sm:border-l sm:border-gray-600/30 sm:pl-4 dark:sm:border-gray-500/30">
                <Actions slug={item.slug} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
