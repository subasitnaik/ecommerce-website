"use client";

import { useEffect } from "react";
import { googleFontStylesheetUrl } from "@/lib/shop-name-fonts";

const LINK_ID = "shop-name-font-stylesheet";

/**
 * Injects a Google Fonts stylesheet for the navbar shop name (one family at a time).
 */
export function ShopNameFontLink({ googleFamily }: { googleFamily: string | null }) {
  useEffect(() => {
    const existing = document.getElementById(LINK_ID);
    if (!googleFamily) {
      existing?.remove();
      return;
    }
    const href = googleFontStylesheetUrl(googleFamily);
    existing?.remove();
    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => {
      document.getElementById(LINK_ID)?.remove();
    };
  }, [googleFamily]);

  return null;
}
