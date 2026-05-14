"use client";

import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi";
import { HiOutlineMenu } from "react-icons/hi";
import { useAppDispatch, useAppSelector } from "../hooks";
import { setSidebar } from "../features/dashboard/dashboardSlice";
import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";
import { toggleDarkMode } from "../features/darkMode/darkModeSlice";
import { siteConfig } from "@/config";

const Header = () => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state) => state.darkMode);

  return (
    <header className="dark:bg-blackPrimary border-b border-blackSecondary/20 bg-whiteSecondary dark:border-whiteSecondary/10">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch(setSidebar())}
            className="rounded-lg p-1.5 text-blackPrimary lg:hidden dark:text-whiteSecondary"
            aria-label="Open menu"
          >
            <HiOutlineMenu className="text-2xl" />
          </button>
          <Link
            to="/"
            className="truncate text-lg font-semibold tracking-tight text-blackPrimary hover:opacity-80 dark:text-whiteSecondary sm:text-xl"
          >
            {siteConfig.name}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {darkMode ? (
            <HiOutlineSun
              onClick={() => dispatch(toggleDarkMode())}
              className="text-xl text-blackPrimary cursor-pointer dark:text-whiteSecondary"
            />
          ) : (
            <HiOutlineMoon
              onClick={() => dispatch(toggleDarkMode())}
              className="text-xl text-blackPrimary cursor-pointer dark:text-whiteSecondary"
            />
          )}
          <Link
            to="/settings"
            className="shrink-0 text-sm font-medium text-blackPrimary hover:underline dark:text-whiteSecondary"
            title="Store settings"
          >
            <span className="sm:hidden">Settings</span>
            <span className="hidden sm:inline">Store settings</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
export default Header;
