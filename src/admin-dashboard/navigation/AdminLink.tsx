"use client";

import NextLink from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useAppDispatch } from "../hooks";
import { closeSidebar } from "../features/dashboard/dashboardSlice";

export const ADMIN_BASE = "/admin";

function isMobileDrawerViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1279px)").matches;
}

/** Maps template paths (`/products`, `/`) to Next.js routes under `/admin`. */
export function adminHref(path: string): string {
  if (!path) return ADMIN_BASE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith(ADMIN_BASE)) return path;
  if (path === "/") return ADMIN_BASE;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${ADMIN_BASE}${p}`;
}

type Props = Omit<ComponentProps<typeof NextLink>, "href"> & {
  /** Legacy prop from react-router */
  to?: string;
  href?: string;
};

export function AdminLink({ to, href, onClick, ...rest }: Props) {
  const dispatch = useAppDispatch();
  const raw = href ?? to ?? "/";
  const dest = adminHref(typeof raw === "string" ? raw : String(raw));

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (isMobileDrawerViewport()) {
      dispatch(closeSidebar());
    }
  }

  return <NextLink href={dest} onClick={handleClick} {...rest} />;
}
