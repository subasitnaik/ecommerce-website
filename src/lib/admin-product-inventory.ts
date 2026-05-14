import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

const sizeEntrySchema = z.object({
  label: z.string().min(1).max(32),
  /** List price in rupees; null/omitted = use product base (no size adjustment). */
  priceRupees: z
    .union([z.coerce.number().finite(), z.null()])
    .optional(),
});

const optUrl = z.union([z.string().url(), z.literal("")]);

export const inventorySchema = z.object({
  sizes: z.array(sizeEntrySchema).min(1).max(40),
  variants: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        imageUrl: optUrl.optional(),
        imageUrl2: optUrl.optional(),
        imageUrl3: optUrl.optional(),
        priceRupees: z
          .union([z.coerce.number().finite(), z.null()])
          .optional(),
      }),
    )
    .min(1)
    .max(32),
  stock: z.array(z.array(z.number().int().min(0))).max(32),
  /** Index into `sizes` / `variants` for combinations that are not sold (not orderable). */
  unavailablePairs: z
    .array(
      z.object({
        sizeIndex: z.number().int().min(0).max(39),
        variantIndex: z.number().int().min(0).max(31),
      }),
    )
    .optional()
    .default([]),
});

export type ProductInventoryPayload = z.infer<typeof inventorySchema>;

export function validateInventoryPayload(
  inv: ProductInventoryPayload,
): string | null {
  const { sizes, variants: vIn, stock: stockMatrix } = inv;
  const unavailablePairs = inv.unavailablePairs ?? [];
  if (vIn.length < 1) {
    return "Add at least one variant (e.g. one row for a single option).";
  }
  if (sizes.length < 1) {
    return "Add at least one size.";
  }
  if (stockMatrix.length !== vIn.length) {
    return "Stock matrix rows must match the number of variants.";
  }
  for (const row of stockMatrix) {
    if (row.length !== sizes.length) {
      return "Each stock row must have one value per size column.";
    }
  }
  const seenU = new Set<string>();
  for (const p of unavailablePairs) {
    if (p.sizeIndex < 0 || p.sizeIndex >= sizes.length) {
      return "Each unavailable combination must use a valid size row.";
    }
    if (p.variantIndex < 0 || p.variantIndex >= vIn.length) {
      return "Each unavailable combination must use a valid variant row.";
    }
    const k = `${p.variantIndex}::${p.sizeIndex}`;
    if (seenU.has(k)) {
      return "Duplicate unavailable size × variant combination.";
    }
    seenU.add(k);
  }
  return null;
}

export async function replaceProductInventory(
  tx: Prisma.TransactionClient,
  productId: string,
  inv: ProductInventoryPayload,
): Promise<void> {
  const { sizes, variants: vIn, stock: stockMatrix } = inv;
  const unavailablePairs = inv.unavailablePairs ?? [];
  const unavailableSet = new Set(
    unavailablePairs.map((p) => `${p.variantIndex}::${p.sizeIndex}`),
  );
  await tx.productStock.deleteMany({ where: { productId } });
  await tx.productVariant.deleteMany({ where: { productId } });
  await tx.productSize.deleteMany({ where: { productId } });

  const sizeIds: string[] = [];
  for (let i = 0; i < sizes.length; i++) {
    const ent = sizes[i]!;
    const pr = ent.priceRupees;
    const pCents =
      pr == null || pr === undefined ? null : Math.max(0, Math.round(pr * 100));
    const row = await tx.productSize.create({
      data: {
        productId,
        label: ent.label.trim(),
        priceCents: pCents,
        sortOrder: i,
      },
    });
    sizeIds.push(row.id);
  }
  const variantIds: string[] = [];
  function optImg(u: string | undefined): string | null {
    const t = u?.trim() ?? "";
    return t === "" ? null : t;
  }
  for (let i = 0; i < vIn.length; i++) {
    const v = vIn[i]!;
    const pR = v.priceRupees;
    const pCents =
      pR == null || pR === undefined ? null : Math.max(0, Math.round(pR * 100));
    const row = await tx.productVariant.create({
      data: {
        productId,
        label: v.label.trim(),
        imageUrl: optImg(v.imageUrl),
        imageUrl2: optImg(v.imageUrl2),
        imageUrl3: optImg(v.imageUrl3),
        priceCents: pCents,
        sortOrder: i,
      },
    });
    variantIds.push(row.id);
  }
  for (let vi = 0; vi < variantIds.length; vi++) {
    for (let si = 0; si < sizeIds.length; si++) {
      const q = stockMatrix[vi]![si] ?? 0;
      const notOffered = unavailableSet.has(`${vi}::${si}`);
      await tx.productStock.create({
        data: {
          productId,
          variantId: variantIds[vi]!,
          sizeId: sizeIds[si]!,
          quantity: q,
          notOffered,
        },
      });
    }
  }

  const firstVar = await tx.productVariant.findFirst({
    where: { productId },
    orderBy: { sortOrder: "asc" },
    select: { imageUrl: true, imageUrl2: true, imageUrl3: true },
  });
  const cover =
    firstVar?.imageUrl || firstVar?.imageUrl2 || firstVar?.imageUrl3 || null;
  await tx.product.update({
    where: { id: productId },
    data: { imageUrl: cover },
  });
}

/** Maps DB product relations to admin edit form: sizes, variants, stock matrix, unavailable pairs. */
export function buildAdminInventoryResponseFromDbProduct(p: {
  sizes: {
    id: string;
    label: string;
    priceCents: number | null;
    sortOrder: number;
  }[];
  variants: {
    id: string;
    label: string;
    imageUrl: string | null;
    imageUrl2: string | null;
    imageUrl3: string | null;
    priceCents: number | null;
    sortOrder: number;
  }[];
  stocks: {
    variantId: string;
    sizeId: string;
    quantity: number;
    notOffered: boolean;
  }[];
}) {
  const sortedSizes = p.sizes
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedVariants = p.variants
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sizeRows = sortedSizes.map((s) => ({
    label: s.label,
    priceRupees:
      s.priceCents == null ? null : Math.round(s.priceCents) / 100,
  }));
  const variantRows = sortedVariants.map((v) => ({
    id: v.id,
    label: v.label,
    imageUrl: v.imageUrl,
    imageUrl2: v.imageUrl2,
    imageUrl3: v.imageUrl3,
    priceRupees:
      v.priceCents == null ? null : Math.round(v.priceCents) / 100,
  }));
  const vOrder = sortedVariants.map((v) => v.id);
  const sOrder = sortedSizes.map((s) => s.id);
  const sIdx = new Map(sOrder.map((id, i) => [id, i] as const));
  const vIdx = new Map(vOrder.map((id, i) => [id, i] as const));
  const stockMap = new Map<string, number>();
  const unavailablePairs: { sizeIndex: number; variantIndex: number }[] = [];
  for (const st of p.stocks) {
    stockMap.set(`${st.variantId}::${st.sizeId}`, st.quantity);
    if (st.notOffered) {
      const si = sIdx.get(st.sizeId);
      const vi = vIdx.get(st.variantId);
      if (si !== undefined && vi !== undefined) {
        unavailablePairs.push({ sizeIndex: si, variantIndex: vi });
      }
    }
  }
  const stock: number[][] = vOrder.map((vid) =>
    sOrder.map((sid) => stockMap.get(`${vid}::${sid}`) ?? 0),
  );
  return { sizeRows, variantRows, stock, unavailablePairs };
}
