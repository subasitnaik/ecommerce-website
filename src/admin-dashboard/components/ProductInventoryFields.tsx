"use client";

/** Shared "sizes + variants + stock" block for add & edit product. */

import { VariantMultiImageUpload, type VariantImageState } from "./ImageUpload";
import { revokeVariantImagePreviewUrls } from "@/lib/admin-upload-image-client";
import type { UnavailablePairForm } from "../product-inventory-helpers";

export type SizeFormRow = {
  label: string;
  /** Empty = use product base for the size part of add-on pricing. */
  priceRupees: string;
};

export type VariantFormRow = {
  label: string;
  priceRupees: string;
} & VariantImageState;

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-600 bg-white px-3 py-2.5 text-sm text-blackPrimary outline-none dark:bg-blackPrimary dark:text-whiteSecondary";

/** One field: size | divider | price; remove is overlay top-right. */
const sizeRowOuter =
  "group relative flex w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-gray-600 bg-white shadow-sm transition focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-black/10 dark:border-gray-500 dark:bg-blackPrimary dark:focus-within:ring-white/20";
const sizeFieldInner =
  "min-w-0 border-0 bg-transparent py-2.5 text-sm text-blackPrimary outline-none placeholder:text-blackPrimary/50 dark:text-whiteSecondary dark:placeholder:text-whiteSecondary/50";
const sizeRemoveBtn =
  "absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded text-lg font-light leading-none text-red-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400/50 dark:hover:bg-red-950/30 dark:hover:text-red-400";

/** Variant card: name + price row (size-style) with swatch block below; × clears the card. */
const variantBlockOuter =
  "group relative w-full min-w-0 overflow-hidden rounded-lg border border-gray-600 bg-white shadow-sm transition focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-black/10 dark:border-gray-500 dark:bg-blackPrimary dark:focus-within:ring-white/20";

type Props = {
  sizeRows: SizeFormRow[];
  setSizeRows: React.Dispatch<React.SetStateAction<SizeFormRow[]>>;
  variantRows: VariantFormRow[];
  setVariantRows: React.Dispatch<React.SetStateAction<VariantFormRow[]>>;
  stockMatrix: number[][];
  setStockMatrix: React.Dispatch<React.SetStateAction<number[][]>>;
  /** Combinations that are not sold on the shop (separate from stock = 0). */
  unavailablePairs: UnavailablePairForm[];
  setUnavailablePairs: React.Dispatch<
    React.SetStateAction<UnavailablePairForm[]>
  >;
  /** Hide sizes/variants help paragraphs (e.g. add-product page). */
  hideSectionHelpText?: boolean;
};

function isPairUnavailable(
  pairs: UnavailablePairForm[],
  variantIndex: number,
  sizeIndex: number,
): boolean {
  return pairs.some(
    (p) => p.variantIndex === variantIndex && p.sizeIndex === sizeIndex,
  );
}

function setPairUnavailable(
  setUnavailablePairs: React.Dispatch<
    React.SetStateAction<UnavailablePairForm[]>
  >,
  variantIndex: number,
  sizeIndex: number,
  notOffered: boolean,
) {
  setUnavailablePairs((prev) => {
    const k = (p: UnavailablePairForm) =>
      p.variantIndex === variantIndex && p.sizeIndex === sizeIndex;
    if (notOffered) {
      if (prev.some(k)) return prev;
      return [...prev, { variantIndex, sizeIndex }];
    }
    return prev.filter((p) => !k(p));
  });
}

export function ProductInventoryFields({
  sizeRows,
  setSizeRows,
  variantRows,
  setVariantRows,
  stockMatrix,
  setStockMatrix,
  unavailablePairs,
  setUnavailablePairs,
  hideSectionHelpText = false,
}: Props) {
  return (
    <>
      <div className="border-t border-gray-600 pt-5 dark:border-gray-500">
        <h3
          className={`text-sm font-bold text-blackPrimary dark:text-whiteSecondary ${hideSectionHelpText ? "mb-3" : ""}`}
        >
          Sizes
        </h3>
        {!hideSectionHelpText ? (
          <p className="mb-3 text-xs text-blackPrimary/70 dark:text-whiteSecondary/70">
            List every size you sell (e.g. S, M, L or 28, 30). Shoppers must pick
            one. Optional list price per size; blank uses the product’s default
            price. Final line price = base + (size list − base) + (option list −
            base).
          </p>
        ) : null}
        <ul className="space-y-2.5">
          {sizeRows.map((row, i) => (
            <li key={i} className="w-full min-w-0">
              <div className={sizeRowOuter}>
                <input
                  className={`${sizeFieldInner} min-w-0 flex-1 pl-3 pr-2`}
                  value={row.label}
                  onChange={(e) => {
                    const n = [...sizeRows];
                    n[i] = { ...n[i]!, label: e.target.value };
                    setSizeRows(n);
                  }}
                  placeholder="Size"
                  aria-label="Size label"
                />
                <div
                  className="w-px shrink-0 self-stretch bg-gray-400/90 dark:bg-gray-500"
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 items-center pr-6">
                  <span
                    className="shrink-0 pl-2.5 pr-0.5 text-sm tabular-nums text-blackPrimary/45 dark:text-whiteSecondary/50"
                    aria-hidden
                  >
                    ₹
                  </span>
                  <input
                    className={`${sizeFieldInner} min-w-0 flex-1 pr-1`}
                    type="text"
                    inputMode="decimal"
                    value={row.priceRupees}
                    onChange={(e) => {
                      const n = [...sizeRows];
                      n[i] = { ...n[i]!, priceRupees: e.target.value };
                      setSizeRows(n);
                    }}
                    placeholder=""
                    title="List price (optional; blank = product base for this size)"
                    aria-label="List price in rupees, optional"
                  />
                </div>
                <button
                  type="button"
                  className={sizeRemoveBtn}
                  onClick={() => {
                    setSizeRows((prev) => prev.filter((_, j) => j !== i));
                  }}
                  aria-label="Remove this size"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 text-sm font-medium underline"
          onClick={() =>
            setSizeRows((s) => [...s, { label: "", priceRupees: "" }])
          }
        >
          + Add size
        </button>
      </div>

      <div className="border-t border-gray-600 pt-5 dark:border-gray-500">
        <h3
          className={`text-sm font-bold text-blackPrimary dark:text-whiteSecondary ${hideSectionHelpText ? "mb-3" : ""}`}
        >
          Options
        </h3>
        {!hideSectionHelpText ? (
          <p className="mb-3 text-xs text-blackPrimary/70 dark:text-whiteSecondary/70">
            Add each sellable option (e.g. one row per colour or material) — like
            Shopify, Amazon, or Flipkart. Add photos per option if you like. Under each
            option, set stock per size, or mark a size as not sold for that option
            (e.g. that colour never comes in XXL).
          </p>
        ) : null}
        <ul className="space-y-2.5">
          {variantRows.map((v, i) => (
            <li key={i} className="w-full min-w-0">
              <div className={variantBlockOuter}>
                <button
                  type="button"
                  className={sizeRemoveBtn}
                  onClick={() => {
                    setVariantRows((r) => {
                      const row = r[i];
                      if (row) {
                        revokeVariantImagePreviewUrls(row);
                      }
                      return r.filter((_, j) => j !== i);
                    });
                  }}
                  aria-label="Remove this variant"
                >
                  ×
                </button>
                <div className="flex w-full min-w-0 items-stretch">
                  <input
                    className={`${sizeFieldInner} min-w-0 flex-1 pl-3 pr-2`}
                    value={v.label}
                    onChange={(e) => {
                      const n = [...variantRows];
                      n[i] = { ...n[i]!, label: e.target.value };
                      setVariantRows(n);
                    }}
                    placeholder="e.g. Navy, Black, 256GB"
                    aria-label="Option name"
                  />
                  <div
                    className="w-px shrink-0 self-stretch bg-gray-400/90 dark:bg-gray-500"
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 items-center pr-6">
                    <span
                      className="shrink-0 pl-2.5 pr-0.5 text-sm tabular-nums text-blackPrimary/45 dark:text-whiteSecondary/50"
                      aria-hidden
                    >
                      ₹
                    </span>
                    <input
                      className={`${sizeFieldInner} min-w-0 flex-1 pr-1`}
                      type="text"
                      inputMode="decimal"
                      value={v.priceRupees}
                      onChange={(e) => {
                        const n = [...variantRows];
                        n[i] = { ...n[i]!, priceRupees: e.target.value };
                        setVariantRows(n);
                      }}
                      placeholder=""
                      title="List price in rupees (optional; blank = product base for this variant)"
                      aria-label="List price in rupees, optional"
                    />
                  </div>
                </div>
                <div className="w-full min-w-0 border-t border-gray-400/90 dark:border-gray-500">
                  <p className="px-3 pt-2.5 text-xs font-medium text-blackPrimary dark:text-whiteSecondary">
                    Photo
                  </p>
                  <p className="px-3 pb-2.5 text-xs text-blackPrimary/60 dark:text-whiteSecondary/60">
                    Up to 3 images per option. Previews show above; they upload
                    when you save. Use the red × to remove one.
                  </p>
                  <div className="px-3 pb-2.5">
                    <VariantMultiImageUpload
                      value={v}
                      onChange={(next) => {
                        const n = [...variantRows];
                        n[i] = { ...n[i]!, ...next };
                        setVariantRows(n);
                      }}
                    />
                  </div>
                </div>
                {sizeRows.length < 1 ? (
                  <div className="border-t border-gray-400/90 px-3 py-3 text-xs text-amber-700 dark:border-gray-500 dark:text-amber-200/90">
                    Add at least one size above to set stock for this option.
                  </div>
                ) : (
                  <div className="w-full min-w-0 border-t border-gray-400/90 dark:border-gray-500">
                    <p className="px-3 pt-3 text-xs font-medium text-blackPrimary dark:text-whiteSecondary">
                      Inventory for this option (by size)
                    </p>
                    <p className="px-3 pb-2 text-xs text-blackPrimary/65 dark:text-whiteSecondary/65">
                      Stock = units available. <strong>Not sold</strong> = this
                      size is not offered for this option (not the same as 0
                      stock).
                    </p>
                    <div className="max-w-full overflow-x-auto px-1 pb-3 sm:px-2">
                      <table className="w-full min-w-[260px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-500/80 text-xs text-blackPrimary/80 dark:text-whiteSecondary/80">
                            <th className="py-1.5 pl-2 pr-2">Size</th>
                            <th className="px-1 py-1.5 text-center">Stock</th>
                            <th className="px-1 py-1.5 text-center">Not sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sizeRows.map((row, si) => {
                            const notSold = isPairUnavailable(
                              unavailablePairs,
                              i,
                              si,
                            );
                            return (
                              <tr
                                key={si}
                                className="border-b border-gray-600/30 last:border-b-0 dark:border-gray-500/30"
                              >
                                <td className="py-1.5 pl-2 pr-2 font-medium text-blackPrimary dark:text-whiteSecondary">
                                  {row.label.trim() || `Size ${si + 1}`}
                                </td>
                                <td className="p-0.5">
                                  <input
                                    type="number"
                                    min={0}
                                    disabled={notSold}
                                    className="w-full min-w-[3.5rem] max-w-[6rem] rounded border border-gray-500 bg-white px-2 py-1.5 text-center text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-blackPrimary dark:text-whiteSecondary"
                                    value={stockMatrix[i]?.[si] ?? 0}
                                    onChange={(e) => {
                                      const q = Math.max(
                                        0,
                                        Math.floor(
                                          parseInt(e.target.value, 10) || 0,
                                        ),
                                      );
                                      setStockMatrix((m) => {
                                        const n = m.map((r) => [...r]);
                                        if (!n[i]) n[i] = [];
                                        const r = [...(n[i] ?? [])];
                                        r[si] = q;
                                        n[i] = r;
                                        return n;
                                      });
                                    }}
                                    aria-label={`Stock for ${row.label || `size ${si + 1}`}`}
                                  />
                                </td>
                                <td className="p-1.5 text-center">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-500"
                                    checked={notSold}
                                    onChange={(e) => {
                                      setPairUnavailable(
                                        setUnavailablePairs,
                                        i,
                                        si,
                                        e.target.checked,
                                      );
                                    }}
                                    aria-label={`Not sold: ${row.label || `size ${si + 1}`} for this option`}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 text-sm font-medium underline"
          onClick={() =>
            setVariantRows((r) => [
              ...r,
              {
                label: "",
                imageUrl: "",
                imageUrl2: "",
                imageUrl3: "",
                imageFile1: null,
                imageFile2: null,
                imageFile3: null,
                priceRupees: "",
              },
            ])
          }
        >
          + Add another option
        </button>
      </div>
    </>
  );
}

export { inputClass as productInventoryInputClass };
