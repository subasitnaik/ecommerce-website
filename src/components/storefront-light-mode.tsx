"use client";

import { useEffect } from "react";

/**
 * Storefront is always light: clears `dark` on <html> when the store layout mounts
 * (e.g. after visiting the admin in dark mode). Does not re-enable dark from
 * `localStorage` or system preference.
 */
export function StorefrontLightMode() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return null;
}
