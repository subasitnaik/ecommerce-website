"use client";

import { useId, useState, type ReactNode } from "react";
import { siteConfig } from "@/config";
import {
  categoryHighlightStorageValue,
  MAX_HOME_HIGHLIGHT_RAILS,
  type CarouselSlide,
} from "@/types/home";
import ImageUpload from "@/admin-dashboard/components/ImageUpload";
import {
  ShopNameFontSection,
  toStoredShopNameFontId,
} from "./shop-name-font-section";

const fieldLabel =
  "block text-xs font-medium uppercase tracking-wide text-blackPrimary/60 dark:text-whiteSecondary/55";
const textInput =
  "mt-1.5 w-full rounded-md border border-gray-600 bg-white px-3 py-2 text-sm text-blackPrimary outline-none transition placeholder:text-blackPrimary/40 focus:border-gray-400 dark:bg-blackPrimary dark:text-whiteSecondary dark:placeholder:text-whiteSecondary/35 dark:focus:border-gray-500";

function SettingsCard({
  title,
  description,
  headerExtra,
  children,
}: {
  title: string;
  description?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-blackSecondary bg-white shadow-sm dark:bg-stone-900/45">
      <div className="flex flex-col gap-3 border-b border-blackSecondary bg-whiteSecondary/90 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 dark:bg-blackSecondary/55">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-blackPrimary dark:text-whiteSecondary">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-blackPrimary/75 dark:text-whiteSecondary/72">
              {description}
            </p>
          ) : null}
        </div>
        {headerExtra ? (
          <div className="shrink-0 sm:pt-0.5">{headerExtra}</div>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function SubBlock({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-blackPrimary/45 dark:text-whiteSecondary/45">
          {eyebrow}
        </p>
      ) : null}
      <div>
        <h3 className="text-base font-semibold text-blackPrimary dark:text-whiteSecondary">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-blackPrimary/70 dark:text-whiteSecondary/68">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

type HighlightCategoryOption = { id: string; slug: string; name: string };

type Props = {
  initialCodEnabled: boolean;
  initialCarouselSlides: CarouselSlide[];
  /** Ordered tokens: `bestsellers` and/or `category:{slug}` — see `ShopSettings.homeHighlightRails`. */
  initialHomeHighlightRails: string[];
  initialHomeProductsPerPage: number;
  initialShopNameFontId: string;
  highlightCategoryOptions: HighlightCategoryOption[];
};

export function WebsiteSettingsForm({
  initialCodEnabled,
  initialCarouselSlides,
  initialHomeHighlightRails,
  initialHomeProductsPerPage,
  initialShopNameFontId,
  highlightCategoryOptions,
}: Props) {
  const productsPerPageId = useId();
  const [shopNameFontId, setShopNameFontId] = useState(initialShopNameFontId);
  const [codEnabled, setCodEnabled] = useState(initialCodEnabled);
  const [slides, setSlides] = useState<CarouselSlide[]>(
    initialCarouselSlides.length > 0
      ? initialCarouselSlides
      : [{ imageUrl: "", alt: "", href: "" }],
  );
  const [homeHighlightRails, setHomeHighlightRails] = useState<string[]>(() =>
    initialHomeHighlightRails.length > 0
      ? initialHomeHighlightRails.slice(0, MAX_HOME_HIGHLIGHT_RAILS)
      : ["bestsellers"],
  );
  const [homeProductsPerPage, setHomeProductsPerPage] = useState(
    initialHomeProductsPerPage,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  function railDisplayTitle(token: string): string {
    if (token === "bestsellers") return "Best sellers";
    if (token.startsWith("category:")) {
      const slug = token.slice("category:".length).trim();
      const cat = highlightCategoryOptions.find((c) => c.slug === slug);
      return cat?.name ?? slug;
    }
    return token;
  }

  function addRail(token: string) {
    const t = token.trim();
    if (!t || homeHighlightRails.length >= MAX_HOME_HIGHLIGHT_RAILS) return;
    if (homeHighlightRails.includes(t)) return;
    setHomeHighlightRails((r) => [...r, t]);
  }

  function removeRail(index: number) {
    setHomeHighlightRails((r) => {
      if (r.length <= 1) return r;
      return r.filter((_, i) => i !== index);
    });
  }

  function moveRail(index: number, delta: number) {
    setHomeHighlightRails((r) => {
      const j = index + delta;
      if (j < 0 || j >= r.length) return r;
      const next = [...r];
      const tmp = next[index]!;
      next[index] = next[j]!;
      next[j] = tmp;
      return next;
    });
  }

  const canAddMore = homeHighlightRails.length < MAX_HOME_HIGHLIGHT_RAILS;
  const remainingAddChoices: { value: string; label: string }[] = [];
  if (canAddMore && !homeHighlightRails.includes("bestsellers")) {
    remainingAddChoices.push({ value: "bestsellers", label: "Best sellers" });
  }
  if (canAddMore) {
    for (const c of highlightCategoryOptions) {
      const val = categoryHighlightStorageValue(c.slug);
      if (homeHighlightRails.includes(val)) continue;
      remainingAddChoices.push({ value: val, label: `${c.name} (/${c.slug})` });
    }
  }

  function addSlide() {
    setSlides((s) => [...s, { imageUrl: "", alt: "", href: "" }]);
  }

  function removeSlide(i: number) {
    setSlides((s) => s.filter((_, j) => j !== i));
  }

  function patchSlide(i: number, patch: Partial<CarouselSlide>) {
    setSlides((s) =>
      s.map((row, j) => (j === i ? { ...row, ...patch } : row)),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setSaveError(null);
    const carouselSlides = slides
      .map((s) => ({
        imageUrl: s.imageUrl.trim(),
        alt: s.alt?.trim() || undefined,
        href: s.href?.trim() || undefined,
      }))
      .filter((s) => s.imageUrl.length > 0);

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codEnabled,
        carouselSlides,
        homeHighlightRails:
          homeHighlightRails.length > 0 ? homeHighlightRails : ["bestsellers"],
        homeProductsPerPage,
        shopNameFont: toStoredShopNameFontId(shopNameFontId),
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setSaveError(body?.error ?? `Save failed (${res.status}).`);
      setStatus("error");
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SettingsCard
        title="Branding"
        description="How your store name appears in the storefront header."
      >
        <ShopNameFontSection
          shopName={siteConfig.name}
          fontId={shopNameFontId}
          onFontIdChange={setShopNameFontId}
        />
      </SettingsCard>

      <SettingsCard
        title="Homepage"
        description="Carousel hero, optional spotlight rail, then the full storefront catalog."
      >
        <div className="space-y-10">
          <SubBlock
            eyebrow="Hero area"
            title="Carousel banners"
            description="Landscape images with optional click-through URL. Drag order is slide 1 → 2 → …."
          >
            <div className="space-y-4">
              {slides.map((slide, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-600 bg-whiteSecondary/50 p-4 dark:bg-blackPrimary/35 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-blackSecondary/80 pb-3 dark:border-whiteSecondary/15">
                    <span className="text-sm font-semibold text-blackPrimary dark:text-whiteSecondary">
                      Slide {i + 1}
                    </span>
                    {slides.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeSlide(i)}
                        className="text-sm font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-400"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <span className={fieldLabel}>Image (required)</span>
                    <p className="mt-1 text-xs text-blackPrimary/60 dark:text-whiteSecondary/55">
                      Upload replaces the banner; leave empty URLs out of saved
                      config.
                    </p>
                    <div className="mt-3 max-w-lg">
                      <ImageUpload
                        value={slide.imageUrl}
                        onChange={(url) => patchSlide(i, { imageUrl: url })}
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block min-w-0">
                      <span className={fieldLabel}>Link URL (optional)</span>
                      <input
                        type="text"
                        value={slide.href ?? ""}
                        onChange={(e) =>
                          patchSlide(i, { href: e.target.value })
                        }
                        className={textInput}
                        placeholder="/products or https://…"
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className={fieldLabel}>Alt text (optional)</span>
                      <input
                        type="text"
                        value={slide.alt ?? ""}
                        onChange={(e) =>
                          patchSlide(i, { alt: e.target.value })
                        }
                        className={textInput}
                        placeholder="Short description"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-white px-4 py-2 text-sm font-medium text-blackPrimary transition hover:border-gray-400 hover:bg-whiteSecondary dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-500"
            >
              <span aria-hidden className="text-lg leading-none">
                +
              </span>
              Add banner slide
            </button>
          </SubBlock>

          <hr className="border-blackSecondary/60 dark:border-whiteSecondary/15" />

          <SubBlock
            eyebrow="Below categories"
            title="Spotlight rails above all products"
            description={
              "Add any mix of Best sellers and category rails. Order is top → bottom on the storefront. The full catalog still appears afterward as All products."
            }
          >
            <div className="max-w-2xl space-y-3">
              <ol className="list-none space-y-2 p-0">
                {homeHighlightRails.map((token, i) => (
                  <li
                    key={`${token}-${i}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-600 bg-white px-3 py-2.5 dark:bg-blackPrimary"
                  >
                    <span className="mr-1 min-w-6 text-xs font-semibold tabular-nums text-blackPrimary/55 dark:text-whiteSecondary/55">
                      {i + 1}.
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-blackPrimary dark:text-whiteSecondary">
                      {railDisplayTitle(token)}
                    </span>
                    <span className="font-mono text-[11px] text-blackPrimary/55 dark:text-whiteSecondary/55">
                      {token === "bestsellers" ? "bestsellers" : token}
                    </span>
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveRail(i, -1)}
                        disabled={i === 0}
                        className="rounded border border-gray-600 px-2 py-1 text-xs font-medium disabled:opacity-40 dark:border-gray-500"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRail(i, 1)}
                        disabled={i >= homeHighlightRails.length - 1}
                        className="rounded border border-gray-600 px-2 py-1 text-xs font-medium disabled:opacity-40 dark:border-gray-500"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRail(i)}
                        disabled={homeHighlightRails.length <= 1}
                        className="rounded px-2 py-1 text-xs font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-40 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="max-w-md min-w-0 flex-1">
                  <span className={fieldLabel}>Add another rail</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) {
                        addRail(v);
                        e.target.value = "";
                      }
                    }}
                    disabled={
                      remainingAddChoices.length === 0 || !canAddMore
                    }
                    className={`${textInput} mt-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <option value="">
                      {remainingAddChoices.length === 0
                        ? "All spotlight options are already added"
                        : "Choose best sellers or a category…"}
                    </option>
                    {remainingAddChoices.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-xs text-blackPrimary/65 dark:text-whiteSecondary/58 sm:pb-1 sm:pl-2">
                  Up to {MAX_HOME_HIGHLIGHT_RAILS} rails. Each loads up to eight
                  products on the storefront.
                </p>
              </div>
            </div>
            <div className="mt-6 max-w-xs">
              <label htmlFor={productsPerPageId} className="block">
                <span className={fieldLabel}>Products per page (all products)</span>
                <span
                  id={`${productsPerPageId}-hint`}
                  className="mt-1 block text-xs font-normal normal-case tracking-normal text-blackPrimary/60 dark:text-whiteSecondary/55"
                >
                  Pagination for the storefront “All products” grid (3–24 per
                  page). Each rail shows up to eight products.
                </span>
                <input
                  id={productsPerPageId}
                  type="number"
                  min={3}
                  max={24}
                  value={homeProductsPerPage}
                  onChange={(e) =>
                    setHomeProductsPerPage(
                      Math.min(
                        24,
                        Math.max(3, parseInt(e.target.value, 10) || 6),
                      ),
                    )
                  }
                  className={`${textInput} mt-2`}
                  aria-describedby={`${productsPerPageId}-hint`}
                />
              </label>
            </div>
          </SubBlock>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Checkout"
        description="Payment methods shown to shoppers during checkout."
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-600 bg-whiteSecondary/80 p-4 dark:bg-blackPrimary/40">
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
            className="mt-1 rounded border-gray-600 text-teal-600 focus:ring-teal-500"
          />
          <span>
            <span className="block text-sm font-medium text-blackPrimary dark:text-whiteSecondary">
              Cash on delivery (COD)
            </span>
            <span className="mt-1 block text-sm text-blackPrimary/70 dark:text-whiteSecondary/68">
              When enabled, customers can choose pay-on-delivery in addition to
              online checkout.
            </span>
          </span>
        </label>
        <p className="mt-4 text-xs leading-relaxed text-blackPrimary/65 dark:text-whiteSecondary/58">
          Card and UPI use Cashfree configured with{" "}
          <code className="rounded bg-whiteSecondary px-1.5 py-0.5 text-[11px] text-blackPrimary dark:bg-blackSecondary dark:text-whiteSecondary">
            CASHFREE_APP_ID
          </code>{" "}
          and{" "}
          <code className="rounded bg-whiteSecondary px-1.5 py-0.5 text-[11px] text-blackPrimary dark:bg-blackSecondary dark:text-whiteSecondary">
            CASHFREE_SECRET_KEY
          </code>{" "}
          — those are never stored in this UI.
        </p>
      </SettingsCard>

      <aside
        aria-label="Category display hint"
        className="rounded-xl border border-blackSecondary bg-whiteSecondary px-5 py-4 dark:bg-blackSecondary/40 sm:px-6"
      >
        <p className="text-sm font-semibold text-blackPrimary dark:text-whiteSecondary">
          Category strip on homepage
        </p>
        <p className="mt-2 text-sm leading-relaxed text-blackPrimary/72 dark:text-whiteSecondary/68">
          The storefront lists up to <strong className="text-blackPrimary dark:text-whiteSecondary">five</strong>{" "}
          categories that have{" "}
          <strong className="text-blackPrimary dark:text-whiteSecondary">
            Show on home
          </strong>{" "}
          enabled, sorted by{" "}
          <strong className="text-blackPrimary dark:text-whiteSecondary">
            sort order
          </strong>
          . Seed defaults with{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs text-blackPrimary dark:bg-blackPrimary dark:text-whiteSecondary">
            npm run db:seed
          </code>{" "}
          or edit categories in{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs text-blackPrimary dark:bg-blackPrimary dark:text-whiteSecondary">
            prisma studio
          </code>
          .
        </p>
      </aside>

      <div className="sticky bottom-4 z-[1] rounded-xl border border-blackSecondary bg-whiteSecondary/95 p-4 shadow-lg backdrop-blur-sm dark:bg-blackPrimary/92 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 dark:backdrop-blur-sm">
        <p className="text-xs text-blackPrimary/65 dark:text-whiteSecondary/58 sm:max-w-md">
          Click save to push changes live. Homepage may need a refresh to reflect
          new banners or typography.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
          {status === "saved" ? (
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Settings saved.
            </span>
          ) : null}
          {status === "error" ? (
            <span className="text-sm font-medium text-red-700 dark:text-red-400 sm:max-w-md sm:text-right">
              {saveError ?? "Could not save."}
            </span>
          ) : null}
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {status === "saving" ? "Saving…" : "Save website settings"}
          </button>
        </div>
      </div>
    </form>
  );
}
