import { makeCartLineId } from "@/lib/product-options";

export type CartLine = {
  /** Unique per size × variant; used to update/remove a row. */
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  quantity: number;
  sizeId?: string | null;
  sizeLabel?: string | null;
  /** @deprecated use sizeLabel */
  size?: string | null;
  variantId?: string | null;
  variantLabel?: string | null;
};

export { makeCartLineId };
