import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  buildAdminInventoryResponseFromDbProduct,
  inventorySchema,
  replaceProductInventory,
  validateInventoryPayload,
} from "@/lib/admin-product-inventory";
import { productCatalogInclude } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { slugFromProductName } from "@/lib/product-slug";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(20_000).optional(),
  priceRupees: z.coerce.number().positive().optional(),
  mrpRupees: z.union([z.coerce.number().nonnegative(), z.null()]).optional(),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
  categoryId: z.string().cuid().nullable().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  /** When set, replaces all sizes, variants, and stock for this product. */
  inventory: inventorySchema.optional(),
});

type Ctx = { params: Promise<{ slug: string }> };

async function loadProductBySlug(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  return prisma.product.findFirst({
    where: { slug },
    include: productCatalogInclude,
  });
}

async function uniqueProductSlugExcludingId(
  base: string,
  excludeId: string,
): Promise<string> {
  const root = base || "product";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? root : `${root}-${n}`;
    const row = await prisma.product.findFirst({
      where: { slug: candidate, NOT: { id: excludeId } },
      select: { id: true },
    });
    if (!row) return candidate;
    n += 1;
  }
}

export async function GET(_request: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: raw } = await context.params;
  if (!raw) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const p = await loadProductBySlug(raw);
    if (!p) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const inv = buildAdminInventoryResponseFromDbProduct({
      sizes: p.sizes,
      variants: p.variants,
      stocks: p.stocks,
    });
    return NextResponse.json({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      priceCents: p.priceCents,
      mrpRupees:
        p.mrpCents == null ? null : Math.round(p.mrpCents) / 100,
      currency: p.currency,
      imageUrl: p.imageUrl,
      active: p.active,
      featured: p.featured,
      categoryId: p.categoryId,
      sizes: inv.sizeRows,
      variants: inv.variantRows,
      stock: inv.stock,
      unavailablePairs: inv.unavailablePairs,
    });
  } catch {
    return NextResponse.json(
      { error: "Database not available." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: raw } = await context.params;
  if (!raw) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 },
    );
  }

  const d = parsed.data;

  try {
    const existing = await loadProductBySlug(raw);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (d.inventory) {
      const err = validateInventoryPayload(d.inventory);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
    }

    const categoryId =
      d.categoryId === undefined
        ? undefined
        : d.categoryId && d.categoryId.length > 0
          ? d.categoryId
          : null;
    if (categoryId) {
      const c = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!c) {
        return NextResponse.json(
          { error: "Invalid category." },
          { status: 400 },
        );
      }
    }

    const nextName =
      d.name !== undefined ? d.name.trim() : existing.name;
    let newSlug: string | undefined;
    if (d.name !== undefined && nextName !== existing.name) {
      newSlug = await uniqueProductSlugExcludingId(
        slugFromProductName(nextName),
        existing.id,
      );
    }

    const imageUrl =
      d.imageUrl === undefined
        ? undefined
        : d.imageUrl.trim() === ""
          ? null
          : d.imageUrl.trim();

    const priceCents =
      d.priceRupees === undefined
        ? undefined
        : Math.max(1, Math.round(d.priceRupees * 100));

    const mrpCents =
      d.mrpRupees === undefined
        ? undefined
        : d.mrpRupees === null
          ? null
          : Math.max(0, Math.round(d.mrpRupees * 100)) > 0
            ? Math.max(0, Math.round(d.mrpRupees * 100))
            : null;

    if (d.inventory) {
      const pid = existing.id;
      await prisma.$transaction(async (tx) => {
        await replaceProductInventory(tx, pid, d.inventory!);
      });
    }

    const scalarData: {
      name?: string;
      slug?: string;
      description?: string;
      priceCents?: number;
      mrpCents?: number | null;
      imageUrl?: string | null;
      categoryId?: string | null;
      featured?: boolean;
      active?: boolean;
    } = {
      ...(d.name !== undefined ? { name: nextName } : {}),
      ...(newSlug ? { slug: newSlug } : {}),
      ...(d.description !== undefined
        ? { description: d.description.trim() || "No description yet." }
        : {}),
      ...(priceCents !== undefined ? { priceCents } : {}),
      ...(mrpCents !== undefined ? { mrpCents } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
    };
    if (Object.keys(scalarData).length > 0) {
      await prisma.product.update({
        where: { id: existing.id },
        data: scalarData,
      });
    }

    const finalSlug = newSlug ?? existing.slug;
    const p = await prisma.product.findFirst({
      where: { slug: finalSlug },
      include: productCatalogInclude,
    });
    if (!p) {
      return NextResponse.json(
        { error: "Product missing after update." },
        { status: 500 },
      );
    }
    const inv = buildAdminInventoryResponseFromDbProduct({
      sizes: p.sizes,
      variants: p.variants,
      stocks: p.stocks,
    });

    return NextResponse.json({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      priceCents: p.priceCents,
      mrpRupees:
        p.mrpCents == null ? null : Math.round(p.mrpCents) / 100,
      currency: p.currency,
      imageUrl: p.imageUrl,
      active: p.active,
      featured: p.featured,
      categoryId: p.categoryId,
      sizes: inv.sizeRows,
      variants: inv.variantRows,
      stock: inv.stock,
      unavailablePairs: inv.unavailablePairs,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not update product." },
      { status: 503 },
    );
  }
}
