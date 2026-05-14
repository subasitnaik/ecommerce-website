"use client";

import NextLink from "next/link";
import type { AdminProductRow } from "@/lib/catalog";
import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";
import { HiOutlinePencil } from "react-icons/hi";
import { HiOutlineTrash } from "react-icons/hi";
import { HiOutlineEye } from "react-icons/hi";

const inStockClass: string =
  "text-green-400 bg-green-400/10 flex-none rounded-full p-1";
const outOfStockClass: string =
  "text-rose-400 bg-rose-400/10 flex-none rounded-full p-1";

type Props = { items: AdminProductRow[] };

function StatusCell({ status }: { status: AdminProductRow["status"] }) {
  return (
    <div className="flex items-center justify-start gap-x-2">
      <div className={status === "In stock" ? inStockClass : outOfStockClass}>
        <div className="h-1.5 w-1.5 rounded-full bg-current" />
      </div>
      <span className="text-sm text-blackPrimary dark:text-whiteSecondary">
        {status}
      </span>
    </div>
  );
}

function Actions({ slug }: { slug: string }) {
  return (
    <div className="flex flex-shrink-0 flex-wrap gap-1">
      <Link
        to={`/products/${slug}`}
        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
        title="Edit in admin"
      >
        <HiOutlinePencil className="text-lg" />
      </Link>
      <NextLink
        href={`/products/${slug}`}
        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
        title="View on storefront"
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

const ProductTable = ({ items }: Props) => {
  return (
    <ul className="mt-6 space-y-3 px-4 sm:px-6 lg:px-8">
      {items.map((item) => (
        <li key={item.id}>
          <div className="flex w-full min-w-0 overflow-hidden rounded-lg border border-gray-600/60 bg-whiteSecondary/90 shadow-sm dark:bg-blackPrimary/50">
            <div className="relative min-h-[7.5rem] w-28 flex-shrink-0 sm:min-h-[8.5rem] sm:w-36 md:w-44">
              {item.product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.product.imageUrl}
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
                  {item.product.name}
                </p>
                <p className="mt-1 font-mono text-xs text-blackPrimary/80 dark:text-whiteSecondary/80">
                  {item.sku}
                </p>
                <div className="mt-2">
                  <StatusCell status={item.status} />
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-col gap-2 sm:items-end sm:justify-between sm:border-l sm:border-gray-600/30 sm:pl-4 dark:sm:border-gray-500/30">
                <p className="text-base font-semibold tabular-nums text-rose-600 dark:text-rose-200 sm:text-right">
                  {item.price}
                </p>
                <Actions slug={item.slug} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ProductTable;
