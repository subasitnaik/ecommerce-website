"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { AdminSignOut } from "./sign-out";

export function AdminSignOutBar() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center justify-end gap-4 border-b border-blackSecondary bg-whiteSecondary px-4 py-2 text-sm dark:border-blackSecondary dark:bg-blackPrimary max-[400px]:px-3">
      <span className="truncate text-blackPrimary dark:text-whiteSecondary">
        {session?.user?.email ?? "Admin"}
      </span>
      <Link
        href="/"
        className="font-medium text-blackPrimary underline-offset-4 hover:underline dark:text-whiteSecondary"
      >
        View storefront
      </Link>
      <AdminSignOut />
    </div>
  );
}
