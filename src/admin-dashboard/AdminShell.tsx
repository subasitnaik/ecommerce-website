"use client";

import Sidebar from "./components/Sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100vh] h-auto min-w-0 flex-row border-t border-blackSecondary bg-whiteSecondary dark:bg-blackPrimary dark:border-blackSecondary">
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden bg-whiteSecondary dark:bg-blackPrimary">
        {children}
      </div>
    </div>
  );
}
