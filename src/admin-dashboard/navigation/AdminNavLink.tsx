"use client";

import { usePathname } from "next/navigation";
import { AdminLink, adminHref, ADMIN_BASE } from "./AdminLink";

type ClassFn = (opts: { isActive: boolean }) => string;

function matchPath(pathname: string, dest: string): boolean {
  if (pathname === dest) return true;
  if (dest === ADMIN_BASE) return false;
  return pathname.startsWith(`${dest}/`);
}

export function AdminNavLink({
  to,
  className,
  children,
  ...rest
}: {
  to: string;
  className?: string | ClassFn;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dest = adminHref(to);
  const isActive = matchPath(pathname, dest);

  const cls =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <AdminLink to={to} className={cls} {...rest}>
      {children}
    </AdminLink>
  );
}
