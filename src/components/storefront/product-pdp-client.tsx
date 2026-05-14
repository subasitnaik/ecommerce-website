"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import {
  linePriceCents,
  maxLinePriceCentsForVariant,
  minLinePriceCentsForVariant,
  stockPairKey,
  variantGalleryUrls,
  type StoreProduct,
} from "@/data/mock-products";
import { getStockForSelection } from "@/lib/product-options";
import { sf } from "@/lib/storefront-ui";
import { StorefrontProductPrice } from "./StorefrontProductPrice";
import type { PdpReviewItem } from "./product-reviews-section";
import { ProductReviewsSection } from "./product-reviews-section";
import { StarRow } from "./product-review-stars";

/** Shown next to stars, e.g. `5` or `4.5` (no `.0`). */
function formatAvgRating(r: number): string {
  const t = Math.round(r * 10) / 10;
  return Number.isInteger(t) ? String(t) : t.toFixed(1);
}

/** Bracket suffix: `2`, `2k`, `10k`, `2.4k` for thousands. */
function formatReviewBracketCount(n: number): string {
  if (n < 0) return "0";
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    if (Math.abs(k - Math.round(k)) < 1e-6) return `${Math.round(k)}k`;
    const one = Math.round(k * 10) / 10;
    const s = Number.isInteger(one) ? String(one) : one.toFixed(1);
    return `${s.replace(/\.0$/, "")}k`;
  }
  const m = n / 1_000_000;
  if (Math.abs(m - Math.round(m)) < 1e-6) return `${Math.round(m)}m`;
  const one = Math.round(m * 10) / 10;
  return `${one.toFixed(1).replace(/\.0$/, "")}m`;
}

type Props = {
  product: StoreProduct;
  shopName: string;
  reviews: PdpReviewItem[];
};

export function ProductPdpClient({
  product,
  shopName,
  reviews,
}: Props) {
  const { addLine } = useCart();

  const sizeOptions = product.sizeOptions ?? [];
  const variants = product.variants ?? [];
  /** No inventory rows in DB — sell as a single simple SKU. */
  const isSimpleProduct = sizeOptions.length === 0 && variants.length === 0;
  const showSizes = sizeOptions.length > 0;
  /** More than one variant option — show swatch/picker. */
  const showVariantUI = !isSimpleProduct && variants.length > 1;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () => variants[0]?.id ?? null,
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const activeVariant = useMemo(() => {
    if (isSimpleProduct) return null;
    if (variants.length === 0) return null;
    const id = showVariantUI ? selectedVariantId : variants[0]!.id;
    if (!id) return null;
    return variants.find((v) => v.id === id) ?? null;
  }, [isSimpleProduct, variants, showVariantUI, selectedVariantId]);

  const gallery = useMemo(() => {
    if (isSimpleProduct) {
      return product.imageUrl ? [product.imageUrl] : [];
    }
    if (!activeVariant) {
      return product.imageUrl ? [product.imageUrl] : [];
    }
    const g = variantGalleryUrls(activeVariant);
    if (g.length > 0) return g;
    return product.imageUrl ? [product.imageUrl] : [];
  }, [isSimpleProduct, product, activeVariant]);

  useEffect(() => {
    setGalleryIndex(0);
  }, [activeVariant?.id, product.id]);

  const mainImage =
    gallery[galleryIndex] ?? gallery[0] ?? product.imageUrl ?? null;

  const { displayPriceCents, showFrom } = useMemo(() => {
    if (isSimpleProduct)
      return { displayPriceCents: product.priceCents, showFrom: false };
    if (!activeVariant)
      return { displayPriceCents: product.priceCents, showFrom: false };
    if (showSizes) {
      if (selectedSizeId) {
        const so = sizeOptions.find((s) => s.id === selectedSizeId);
        if (so) {
          return {
            displayPriceCents: linePriceCents(product, so, activeVariant),
            showFrom: false,
          };
        }
      }
      const minP = minLinePriceCentsForVariant(product, activeVariant);
      const maxP = maxLinePriceCentsForVariant(product, activeVariant);
      return { displayPriceCents: minP, showFrom: minP < maxP };
    }
    return {
      displayPriceCents: linePriceCents(product, null, activeVariant),
      showFrom: false,
    };
  }, [
    isSimpleProduct,
    product,
    activeVariant,
    showSizes,
    selectedSizeId,
    sizeOptions,
  ]);

  const lineVariantId = activeVariant?.id ?? null;

  const stockForSelection = useMemo(() => {
    if (isSimpleProduct) return 999;
    if (!selectedSizeId) return 999;
    return getStockForSelection(
      product,
      lineVariantId,
      selectedSizeId,
    );
  }, [isSimpleProduct, product, lineVariantId, selectedSizeId]);

  const maxOrderQty = useMemo(() => {
    if (stockForSelection > 500) return 99;
    if (stockForSelection < 1) return 0;
    return stockForSelection;
  }, [stockForSelection]);

  const selectedPairNotSold = useMemo(() => {
    if (!showSizes || !selectedSizeId || !lineVariantId) return false;
    return Boolean(
      product.notOfferedByPair?.[stockPairKey(lineVariantId, selectedSizeId)],
    );
  }, [
    showSizes,
    selectedSizeId,
    lineVariantId,
    product.notOfferedByPair,
  ]);

  useEffect(() => {
    setQty((q) => Math.min(q, Math.max(1, maxOrderQty || 1)));
  }, [maxOrderQty, selectedSizeId, lineVariantId]);

  const handleAdd = useCallback(() => {
    if (isSimpleProduct) {
      addLine({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        currency: product.currency,
        imageUrl: product.imageUrl,
        sizeId: null,
        sizeLabel: null,
        variantId: null,
        variantLabel: null,
        quantity: qty,
      });
      setFlash(true);
      setTimeout(() => setFlash(false), 2000);
      return;
    }
    if (showSizes && !selectedSizeId) {
      setSizeError(true);
      return;
    }
    if (!activeVariant) {
      return;
    }
    setSizeError(false);
    const so = sizeOptions.find((s) => s.id === selectedSizeId);
    const st = getStockForSelection(
      product,
      activeVariant.id,
      selectedSizeId,
    );
    if (st < 1) return;
    const addQty = Math.min(qty, st > 500 ? qty : st);
    const line = linePriceCents(
      product,
      showSizes && so ? so : null,
      activeVariant,
    );
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: line,
      currency: product.currency,
      imageUrl: mainImage,
      sizeId: showSizes ? selectedSizeId : null,
      sizeLabel: so?.label ?? null,
      variantId: activeVariant.id,
      variantLabel: activeVariant.label,
      quantity: addQty,
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  }, [
    addLine,
    product,
    isSimpleProduct,
    showSizes,
    selectedSizeId,
    activeVariant,
    sizeOptions,
    mainImage,
    qty,
    lineVariantId,
  ]);

  const { averageRating, reviewCount } = useMemo(() => {
    const n = reviews.length;
    if (n === 0) return { averageRating: 0, reviewCount: 0 };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return { averageRating: sum / n, reviewCount: n };
  }, [reviews]);

  function stepDelta(delta: number) {
    setQty((q) => {
      const cap = maxOrderQty > 0 ? maxOrderQty : 99;
      return Math.max(1, Math.min(cap, q + delta));
    });
  }

  return (
    <div className={sf.pageProduct}>
      <nav className={`flex flex-wrap items-center gap-2 ${sf.crNav}`}>
        <Link href="/" className={sf.crLink}>
          Home
        </Link>
        <span className={sf.crSep}>/</span>
        <Link href="/products" className={sf.crLink}>
          Shop
        </Link>
        <span className={sf.crSep}>/</span>
        <span className="line-clamp-1 max-w-[min(12rem,40vw)] text-neutral-500 dark:text-neutral-500">
          {product.name}
        </span>
      </nav>

      <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-14 xl:gap-20">
        <div className="lg:sticky lg:top-24">
          <div
            className="overflow-hidden rounded-lg bg-neutral-200/50 ring-1 ring-black/5 sm:p-1"
            style={{
              background:
                "linear-gradient(145deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)",
            }}
          >
            <div className="overflow-hidden bg-neutral-100/80 dark:bg-neutral-800/30">
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainImage}
                  alt={product.name}
                  className="aspect-[4/5] w-full object-cover sm:aspect-square"
                />
              ) : (
                <div
                  className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-200/80 text-sm text-neutral-500 sm:aspect-square"
                  aria-hidden
                >
                  No photo yet
                </div>
              )}
            </div>
            {gallery.length > 1 ? (
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((src, idx) => (
                  <button
                    key={`${src}-${idx}`}
                    type="button"
                    onClick={() => setGalleryIndex(idx)}
                    className={
                      idx === galleryIndex
                        ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-white dark:ring-neutral-100 dark:ring-offset-neutral-950"
                        : "opacity-80 ring-1 ring-black/10 hover:opacity-100 dark:ring-white/10"
                    }
                    aria-label={`Photo ${idx + 1}`}
                    aria-current={idx === galleryIndex}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="h-16 w-16 shrink-0 object-cover sm:h-20 sm:w-20"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 border-t border-neutral-200 pt-8 lg:border-t-0 lg:pt-0 dark:border-neutral-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {shopName}
          </p>

          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
            {product.name}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
              <StorefrontProductPrice
                product={product}
                finalCents={displayPriceCents}
                showFrom={showFrom}
                variant="pdp"
              />
            </p>
            {reviewCount > 0 ? (
              <div className="flex flex-wrap items-center gap-x-2.5 border-l border-neutral-300 pl-4 dark:border-neutral-600">
                <StarRow
                  rating={averageRating}
                  className="text-lg font-medium sm:text-xl"
                />
                <span
                  className="text-lg font-medium tabular-nums text-neutral-700 dark:text-neutral-300 sm:text-xl"
                  aria-label={`${formatAvgRating(averageRating)} average from ${reviewCount} reviews`}
                >
                  {`${formatAvgRating(averageRating)} [${formatReviewBracketCount(reviewCount)}]`}
                </span>
              </div>
            ) : (
              <span className="text-sm text-neutral-500 dark:text-neutral-500">
                No reviews yet
              </span>
            )}
          </div>

          {showVariantUI && activeVariant ? (
            <div className="mt-8">
              <div
                className="flex flex-wrap gap-2.5"
                role="listbox"
                aria-label="Options"
              >
                {variants.map((v) => {
                  const sel = v.id === selectedVariantId;
                  const optionThumb = variantGalleryUrls(v)[0];
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="option"
                      aria-selected={sel}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={
                        sel
                          ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-white dark:ring-neutral-100 dark:ring-offset-neutral-950"
                          : "ring-1 ring-black/10 hover:ring-black/20 dark:ring-white/10"
                      }
                      title={v.label}
                    >
                      {optionThumb ? (
                        <span className="block h-11 w-11 overflow-hidden rounded-md sm:h-12 sm:w-12">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={optionThumb}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </span>
                      ) : (
                        <span className="flex h-11 min-w-[2.75rem] items-center justify-center rounded-md bg-neutral-100 px-2 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 sm:h-12">
                          {v.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {showSizes ? (
            <div className="mt-8">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                  Select size
                </p>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Required
                </span>
              </div>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="listbox"
                aria-label="Size"
                aria-invalid={sizeError}
              >
                {sizeOptions.map((sz) => {
                  const sel = sz.id === selectedSizeId;
                  const notSold =
                    lineVariantId != null &&
                    Boolean(
                      product.notOfferedByPair?.[
                        stockPairKey(lineVariantId, sz.id)
                      ],
                    );
                  const n =
                    lineVariantId != null
                      ? getStockForSelection(
                          product,
                          lineVariantId,
                          sz.id,
                        )
                      : 0;
                  const oos = !notSold && n < 1;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      role="option"
                      aria-disabled={oos || notSold}
                      aria-selected={sel}
                      disabled={oos || notSold}
                      title={
                        notSold
                          ? "Not sold in this size for this option"
                          : oos
                            ? "Out of stock"
                            : undefined
                      }
                      onClick={() => {
                        if (oos || notSold) return;
                        setSelectedSizeId(sz.id);
                        setSizeError(false);
                      }}
                      className={
                        notSold
                          ? "min-h-[2.75rem] min-w-[2.75rem] cursor-not-allowed rounded-md border border-dotted border-neutral-400 bg-neutral-50 px-3 text-sm font-medium text-neutral-500 dark:border-neutral-600 dark:bg-neutral-900/30 dark:text-neutral-500"
                          : oos
                            ? "min-h-[2.75rem] min-w-[2.75rem] cursor-not-allowed rounded-md border border-dashed border-neutral-300 bg-neutral-100 px-3 text-sm font-medium text-neutral-400 line-through dark:border-neutral-600 dark:bg-neutral-900/20 dark:text-neutral-600"
                            : sel
                              ? "min-h-[2.75rem] min-w-[2.75rem] rounded-md border-2 border-neutral-900 bg-neutral-900 px-3 text-sm font-semibold text-white dark:border-white dark:bg-white dark:text-black"
                              : "min-h-[2.75rem] min-w-[2.75rem] rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 transition hover:border-neutral-500 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100 dark:hover:border-neutral-500"
                      }
                    >
                      {sz.label}
                      {notSold ? (
                        <span className="sr-only"> (not sold)</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {sizeError ? (
                <p
                  className="mt-2 border-l-2 border-neutral-900 pl-2 text-sm text-neutral-900 dark:border-neutral-100 dark:text-neutral-50"
                  role="alert"
                >
                  Please select a size
                </p>
              ) : null}
              {selectedSizeId && !selectedPairNotSold && stockForSelection < 500 && (
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
                  {stockForSelection < 1
                    ? "Out of stock in this size for the selected variant."
                    : `${stockForSelection} left in stock for this size.`}
                </p>
              )}
              {selectedSizeId && selectedPairNotSold && (
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
                  This size isn’t available for the selected option.
                </p>
              )}
            </div>
          ) : null}

          <div className={`mt-8 ${sf.card} p-5 sm:p-6`}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
              Details
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-[1.75] text-neutral-800 dark:text-neutral-200 sm:text-[0.9375rem]">
              {product.description}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-4">
            <div className="sm:flex-1 sm:min-w-[8rem]">
              <span
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
                id="pdp-qty-label"
              >
                Quantity
              </span>
              <div
                className="mt-2 flex h-11 max-w-[10rem] overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-600 dark:bg-neutral-800/50"
                role="group"
                aria-labelledby="pdp-qty-label"
              >
                <button
                  type="button"
                  onClick={() => stepDelta(-1)}
                  className="flex-1 px-2 text-lg leading-none text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200/90 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="flex min-w-[2.75rem] flex-[0.7] items-center justify-center border-x border-neutral-200 text-sm font-semibold tabular-nums text-neutral-900 dark:border-neutral-600 dark:text-neutral-100">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => stepDelta(1)}
                  disabled={maxOrderQty > 0 && qty >= maxOrderQty}
                  className="flex-1 px-2 text-lg leading-none text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200/90 disabled:opacity-40 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex sm:items-end">
              <button
                type="button"
                onClick={handleAdd}
                disabled={
                  (!isSimpleProduct && !activeVariant) ||
                  (showSizes && !selectedSizeId) ||
                  selectedPairNotSold ||
                  (stockForSelection < 1 && !isSimpleProduct)
                }
                className="h-11 min-w-[11rem] rounded-md bg-neutral-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                {flash
                  ? "Added to your bag"
                  : selectedPairNotSold
                    ? "Not available"
                    : stockForSelection < 1 && showSizes
                      ? "Out of stock"
                      : "Add to bag"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductReviewsSection reviews={reviews} />
    </div>
  );
}
