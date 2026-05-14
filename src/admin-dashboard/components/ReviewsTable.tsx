"use client";

import NextLink from "next/link";
import type { AdminReviewRow } from "@/lib/catalog";
import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";
import { HiOutlinePencil } from "react-icons/hi";
import { HiOutlineTrash } from "react-icons/hi";
import { HiOutlineEye } from "react-icons/hi";
import { HiStar } from "react-icons/hi";

const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 0; i < rating; i++) {
    stars.push(<HiStar key={i} className="text-yellow-500" />);
  }
  return stars;
};

type Props = { items: AdminReviewRow[] };

function ReviewActions({ id, productSlug }: { id: string; productSlug: string }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Link
        to={`/reviews/${id}`}
        className="flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
      >
        <HiOutlinePencil className="text-lg" />
      </Link>
      <NextLink
        href={`/products/${productSlug}`}
        className="flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
        title="View product on storefront"
      >
        <HiOutlineEye className="text-lg" />
      </NextLink>
      <Link
        to="#"
        className="flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
      >
        <HiOutlineTrash className="text-lg" />
      </Link>
    </div>
  );
}

const ReviewsTable = ({ items }: Props) => {
  return (
    <>
      <div className="mt-6 space-y-3 px-4 sm:px-6 md:hidden lg:px-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-600/60 bg-whiteSecondary/80 p-4 dark:bg-blackPrimary/40"
          >
            <p className="text-sm font-medium text-blackPrimary dark:text-whiteSecondary">
              {item.user.name}
            </p>
            <div className="mt-1 flex text-lg leading-6">{renderStars(item.rating)}</div>
            <p className="mt-2 text-sm font-medium text-blackPrimary/90 dark:text-whiteSecondary/90">
              {item.product}
            </p>
            <p className="mt-1 text-xs text-blackPrimary/70 dark:text-whiteSecondary/70">
              {item.lastLogin}
            </p>
            <div className="mt-3 border-t border-white/5 pt-3">
              <ReviewActions id={item.id} productSlug={item.productSlug} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden min-w-0 overflow-x-auto md:block">
        <table className="mt-6 w-full min-w-[700px] whitespace-nowrap text-left">
          <thead className="border-b border-white/10 text-sm leading-6 text-blackPrimary dark:text-whiteSecondary">
            <tr>
              <th
                scope="col"
                className="py-2 pl-4 pr-8 font-semibold sm:pl-6 lg:pl-8"
              >
                Reviewer
              </th>
              <th scope="col" className="py-2 pr-8 font-semibold">
                Rating
              </th>
              <th scope="col" className="py-2 pr-8 font-semibold">
                Product
              </th>
              <th scope="col" className="py-2 pr-8 font-semibold lg:pr-20">
                Date
              </th>
              <th
                scope="col"
                className="py-2 pr-4 text-right font-semibold sm:pr-6 lg:pr-8"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-4 pl-4 pr-8 sm:pl-6 lg:pl-8">
                  <div className="truncate text-sm font-medium leading-6 text-blackPrimary dark:text-whiteSecondary">
                    {item.user.name}
                  </div>
                </td>
                <td className="py-4 pr-8">
                  <div className="flex gap-x-3 py-1 text-lg leading-6">
                    {renderStars(item.rating)}
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm leading-6 sm:pr-8 lg:pr-20">
                  <div className="block font-medium text-blackPrimary dark:text-whiteSecondary">
                    {item.product}
                  </div>
                </td>
                <td className="py-4 pr-8 text-sm leading-6 text-blackPrimary dark:text-whiteSecondary lg:pr-20">
                  {item.lastLogin}
                </td>
                <td className="py-4 pr-4 text-right text-sm leading-6 text-blackPrimary dark:text-whiteSecondary sm:pr-6 lg:pr-8">
                  <div className="flex justify-end gap-x-1">
                    <Link
                      to={`/reviews/${item.id}`}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
                    >
                      <HiOutlinePencil className="text-lg" />
                    </Link>
                    <NextLink
                      href={`/products/${item.productSlug}`}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
                      title="View product on storefront"
                    >
                      <HiOutlineEye className="text-lg" />
                    </NextLink>
                    <Link
                      to="#"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center border border-gray-600 bg-whiteSecondary text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
                    >
                      <HiOutlineTrash className="text-lg" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
export default ReviewsTable;
