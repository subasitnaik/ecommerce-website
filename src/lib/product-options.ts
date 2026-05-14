import type { StoreProduct } from "@/data/mock-products";
import { stockPairKey } from "@/data/mock-products";

export function makeCartLineId(
  productId: string,
  opts: {
    variantId?: string | null;
    sizeId?: string | null;
    /** legacy cart rows */
    sizeLabel?: string | null;
  },
): string {
  const v = (opts.variantId ?? "").trim();
  const s = (opts.sizeId ?? opts.sizeLabel ?? "").trim();
  return `${productId}::${v}::${s}`;
}

export function getStockForSelection(
  product: StoreProduct,
  variantId: string | null,
  sizeId: string | null,
): number {
  if (!sizeId) return 999;
  if (!product.stockByPair) return 999;
  let v = variantId;
  if (!v && (product.variants?.length ?? 0) === 1) {
    v = product.variants![0]!.id;
  }
  if (!v) return 0;
  if (product.notOfferedByPair?.[stockPairKey(v, sizeId)]) {
    return 0;
  }
  return product.stockByPair[stockPairKey(v, sizeId)] ?? 0;
}

export { stockPairKey };

/** One-line label for bag / checkout, e.g. "Navy · M" */
export function formatCartLineOptions(line: {
  sizeLabel?: string | null;
  size?: string | null;
  variantLabel?: string | null;
}): string | null {
  const size =
    (line.sizeLabel && line.sizeLabel.length > 0
      ? line.sizeLabel
      : line.size) ?? null;
  const parts: string[] = [];
  if (line.variantLabel) parts.push(line.variantLabel);
  if (size) parts.push(`Size ${size}`);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}
