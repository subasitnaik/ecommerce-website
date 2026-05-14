"use client";

// *********************
// Role of the component: Sidebar component that displays the sidebar navigation
// Name of the component: Sidebar.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Sidebar />
// Input parameters: roles: no input parameters
// Output: Sidebar component that displays the sidebar navigation
// *********************

import { HiOutlineHome } from "react-icons/hi";
import { HiOutlineDevicePhoneMobile } from "react-icons/hi2";
import { HiOutlineTag } from "react-icons/hi";
import { HiOutlineTruck } from "react-icons/hi";
import { HiOutlineStar } from "react-icons/hi";
import { HiOutlineCog, HiOutlineGift } from "react-icons/hi";
import { useAppDispatch, useAppSelector } from "../hooks";
import { HiOutlineX } from "react-icons/hi";
import {
  closeSidebar,
  setSidebar,
} from "../features/dashboard/dashboardSlice";
import { AdminNavLink as NavLink } from "@/admin-dashboard/navigation/AdminNavLink";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Set to `true` to show “Landing pages” (Overview v1 / v2) in the sidebar again. */
const LANDING_PAGES_ENABLED = false;

function LandingPagesNav({
  navActiveClass,
  navInactiveClass,
}: {
  navActiveClass: string;
  navInactiveClass: string;
}) {
  const [isLandingOpen, setIsLandingOpen] = useState(false);
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsLandingOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsLandingOpen((v) => !v);
          }
        }}
        className="block flex cursor-pointer items-center self-stretch gap-4 bg-whiteSecondary px-6 py-4 text-blackPrimary hover:bg-white dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:bg-blackSecondary max-lg:py-3"
      >
        <HiOutlineHome className="text-xl" />
        <span className="text-lg">Landing pages</span>
      </div>
      {isLandingOpen ? (
        <div>
          <NavLink
            to="/"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineHome className="text-xl" />
            <span className="text-lg">Overview v1</span>
          </NavLink>
          <NavLink
            to="/landing-v2"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineHome className="text-xl" />
            <span className="text-lg">Overview v2</span>
          </NavLink>
        </div>
      ) : null}
    </>
  );
}

const Sidebar = () => {
  const pathname = usePathname();
  const { isSidebarOpen } = useAppSelector((state) => state.dashboard);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window === "undefined") return;
    /* Below `lg` (1024px) the sidebar is a drawer; close it after navigation. */
    if (window.matchMedia("(max-width: 1023px)").matches) {
      dispatch(closeSidebar());
    }
  }, [pathname, dispatch]);

  /** Drawer slides only below `lg`. From `lg` up, no transform — nav column always visible. */
  const drawerSlideClass =
    isSidebarOpen
      ? "max-lg:translate-x-0 max-lg:transition-transform max-lg:duration-300 max-lg:ease-in"
      : "max-lg:-translate-x-full max-lg:transition-transform max-lg:duration-300 max-lg:ease-out";

  const navActiveClass: string =
    "block dark:bg-whiteSecondary flex items-center self-stretch gap-4 py-4 px-6 cursor-pointer max-lg:py-3 dark:text-blackPrimary bg-white text-blackPrimary";
  const navInactiveClass: string =
    "block flex items-center self-stretch gap-4 py-4 px-6 dark:bg-blackPrimary dark:hover:bg-blackSecondary cursor-pointer max-lg:py-3 dark:text-whiteSecondary hover:bg-white text-blackPrimary bg-whiteSecondary";

  return (
    <div className="relative">
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={() => dispatch(closeSidebar())}
        />
      ) : null}
      <div
        className={`shrink-0 w-72 min-h-0 h-[100vh] dark:bg-blackPrimary bg-whiteSecondary pt-6 shadow-xl max-lg:shadow-2xl lg:shadow-none lg:sticky lg:top-0 lg:z-10 lg:max-h-screen lg:overflow-y-auto max-lg:fixed max-lg:top-0 max-lg:z-[50] max-lg:overflow-y-auto ${drawerSlideClass}`}
      >
        <HiOutlineX
          className="ml-auto mb-2 mr-2 cursor-pointer text-2xl text-blackPrimary dark:text-whiteSecondary lg:hidden"
          onClick={() => dispatch(setSidebar())}
        />
        <div>
          {LANDING_PAGES_ENABLED ? (
            <LandingPagesNav
              navActiveClass={navActiveClass}
              navInactiveClass={navInactiveClass}
            />
          ) : null}

          <NavLink
            to="/"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineHome className="text-xl" />
            <span className="text-lg">Dashboard</span>
          </NavLink>

          <NavLink
            to="/products"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineDevicePhoneMobile className="text-xl" />
            <span className="text-lg">Products</span>
          </NavLink>
          <NavLink
            to="/categories"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineTag className="text-xl" />
            <span className="text-lg">Categories</span>
          </NavLink>
          <NavLink
            to="/orders"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineTruck className="text-xl" />
            <span className="text-lg">Orders</span>
          </NavLink>
          <NavLink
            to="/reviews"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineStar className="text-xl" />
            <span className="text-lg">Reviews</span>
          </NavLink>

          <NavLink
            to="/coupons"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineGift className="text-xl" />
            <span className="text-lg">Discount coupons</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={(isActiveObj) =>
              isActiveObj.isActive ? navActiveClass : navInactiveClass
            }
          >
            <HiOutlineCog className="text-xl" />
            <span className="text-lg">Website settings</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
