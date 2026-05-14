"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SHOP_NAME_FONTS,
  getShopNameFontById,
  googleFontStylesheetUrl,
  shopNameFontCssStack,
} from "@/lib/shop-name-fonts";

const PREVIEW_LINK_ID = "admin-shop-name-font-preview";

type Props = {
  shopName: string;
  fontId: string;
  onFontIdChange: (id: string) => void;
};

const GROUP_ORDER = ["Sans", "Serif", "Display", "Script"] as const;

function usePreviewFont(googleFamily: string | null) {
  useEffect(() => {
    const existing = document.getElementById(PREVIEW_LINK_ID);
    if (!googleFamily) {
      existing?.remove();
      return;
    }
    const href = googleFontStylesheetUrl(googleFamily);
    if (
      existing instanceof HTMLLinkElement &&
      existing.getAttribute("href") === href
    ) {
      return;
    }
    existing?.remove();
    const link = document.createElement("link");
    link.id = PREVIEW_LINK_ID;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    return () => {
      document.getElementById(PREVIEW_LINK_ID)?.remove();
    };
  }, [googleFamily]);
}

const searchInputClass =
  "mt-1.5 w-full rounded-md border border-gray-600 bg-white px-3 py-2.5 text-sm text-blackPrimary outline-none transition placeholder:text-blackPrimary/40 focus:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:placeholder:text-whiteSecondary/35 dark:focus:border-gray-500";

export function ShopNameFontSection({
  shopName,
  fontId,
  onFontIdChange,
}: Props) {
  const [query, setQuery] = useState("");

  const selectedEntry = useMemo(
    () => getShopNameFontById(fontId) ?? getShopNameFontById("default"),
    [fontId],
  );

  const googleForPreview =
    selectedEntry && selectedEntry.googleFamily
      ? selectedEntry.googleFamily
      : null;
  usePreviewFont(googleForPreview);

  const previewFont = useMemo(() => {
    if (!selectedEntry?.googleFamily) {
      return { fontFamily: "ui-sans-serif, system-ui, sans-serif" as const };
    }
    return { fontFamily: shopNameFontCssStack(selectedEntry) };
  }, [selectedEntry]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHOP_NAME_FONTS;
    return SHOP_NAME_FONTS.filter(
      (f) =>
        f.label.toLowerCase().includes(q) || f.group.toLowerCase().includes(q),
    );
  }, [query]);

  const byGroup = useMemo(() => {
    const m = new Map<string, typeof SHOP_NAME_FONTS>();
    for (const g of GROUP_ORDER) m.set(g, []);
    for (const f of filtered) {
      const list = m.get(f.group);
      if (list) list.push(f);
    }
    return m;
  }, [filtered]);

  return (
    <div className="space-y-4">
        <div
          className="rounded-xl border border-gray-600 bg-whiteSecondary px-4 py-5 dark:bg-blackPrimary/55 sm:px-5"
          aria-live="polite"
        >
          <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-blackPrimary/55 dark:text-whiteSecondary/55">
            Header preview
          </p>
          <div className="mt-4 flex min-h-[4.25rem] w-full items-center justify-center rounded-lg border border-blackSecondary bg-white px-4 py-3 shadow-inner dark:bg-stone-950 sm:min-h-[4.75rem] sm:px-8">
            <span
              className="text-center text-[1.1rem] font-semibold tracking-tight text-blackPrimary dark:text-whiteSecondary sm:text-lg"
              style={previewFont}
            >
              {shopName}
            </span>
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-blackPrimary/70 dark:text-whiteSecondary/65">
            {selectedEntry?.id === "default"
              ? "Matches the storefront body sans until you choose a headline font."
              : `${selectedEntry?.label} — shown to shoppers after you save.`}
          </p>
        </div>

        <label htmlFor="admin-shop-font-search" className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-blackPrimary/60 dark:text-whiteSecondary/55">
            Search fonts
          </span>
          <input
            id="admin-shop-font-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Playfair, script, serif…"
            className={searchInputClass}
            autoComplete="off"
          />
        </label>

        <div className="max-h-[min(380px,50vh)] space-y-5 overflow-y-auto pr-1 sm:max-h-[min(440px,55vh)]">
          {GROUP_ORDER.map((group) => {
            const list = byGroup.get(group) ?? [];
            if (list.length === 0) return null;
            return (
              <div key={group}>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-blackPrimary/55 dark:text-whiteSecondary/48">
                  {group}
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {list.map((f) => {
                    const active = f.id === fontId;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onFontIdChange(f.id)}
                        className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "border-teal-600 bg-teal-50 text-teal-950 ring-2 ring-teal-600/35 dark:border-teal-500/85 dark:bg-teal-950/45 dark:text-teal-50 dark:ring-teal-500/30"
                            : "border-gray-600 bg-white text-blackPrimary hover:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
                        }`}
                      >
                        <span className="font-medium">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-blackPrimary/65 dark:text-whiteSecondary/58">
              No fonts match that search.
            </p>
          ) : null}
        </div>
  </div>
  );
}

export function toStoredShopNameFontId(selectedId: string): string | null {
  if (selectedId === "default" || !selectedId) return null;
  return selectedId;
}
