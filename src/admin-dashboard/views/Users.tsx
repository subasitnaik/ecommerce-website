"use client";

import {
  adminFilterInputClass,
  adminSortSelectClass,
} from "@/admin-dashboard/admin-filters";
import {
  HiOutlineChevronRight,
  HiOutlinePlus,
  HiOutlineSearch,
} from "react-icons/hi";
import {
  Pagination,
  RowsPerPage,
  Sidebar,
  UserTable,
  WhiteButton,
} from "../components";
import { AiOutlineExport } from "react-icons/ai";

const Users = () => {
  return (
    <div className="flex h-auto min-w-0 border-t border-1 border-blackSecondary bg-whiteSecondary dark:bg-blackPrimary">
      <Sidebar />
      <div className="w-full min-w-0 dark:bg-blackPrimary bg-whiteSecondary">
        <div className="py-6 sm:py-10 dark:bg-blackPrimary bg-whiteSecondary">
          <div className="flex w-full min-w-0 flex-col items-stretch gap-4 px-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:px-8">
            <div className="min-w-0 flex flex-col gap-2 sm:gap-3">
              <h2 className="text-2xl font-bold leading-7 text-blackPrimary dark:text-whiteSecondary sm:text-3xl">
                All users
              </h2>
              <p className="flex items-center text-base font-normal text-blackPrimary dark:text-whiteSecondary">
                <span>Dashboard</span>{" "}
                <HiOutlineChevronRight className="text-lg" />{" "}
                <span>All users</span>
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-md sm:flex-row sm:items-center sm:gap-2">
              <button
                type="button"
                className="flex w-full min-w-0 items-center justify-center gap-x-2 border border-gray-600 bg-whiteSecondary py-2 text-base duration-200 dark:bg-blackPrimary sm:w-32 dark:hover:border-gray-500 hover:border-gray-400"
              >
                <AiOutlineExport className="text-base text-blackPrimary dark:text-whiteSecondary" />
                <span className="font-medium text-blackPrimary dark:text-whiteSecondary">Export</span>
              </button>
              <WhiteButton
                link="/users/create-user"
                text="Add a user"
                textSize="lg"
                py="2"
                width="48"
              >
                <HiOutlinePlus className="dark:text-blackPrimary text-whiteSecondary" />
              </WhiteButton>
            </div>
          </div>
          <div className="mt-5 flex w-full min-w-0 flex-col gap-3 px-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:px-8">
            <div className="relative w-full min-w-0 sm:max-w-sm sm:flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <input
                type="text"
                className={adminFilterInputClass}
                placeholder="Search users..."
              />
            </div>
            <div className="w-full min-w-0 sm:w-auto sm:max-w-sm">
              <select
                className={adminSortSelectClass}
                name="sort"
                id="sort"
              >
                <option value="default">Sort by</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
          <UserTable />
          <div className="flex flex-col items-stretch justify-between gap-4 px-4 py-6 max-sm:pb-0 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <RowsPerPage />
            <Pagination />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Users;
