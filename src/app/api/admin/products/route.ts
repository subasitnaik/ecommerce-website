import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  inventorySchema,
  replaceProductInventory,
  validateInventoryPayload,
} from "@/lib/admin-product-inventory";
import { prisma } from "@/lib/prisma";
import { slugFromProductName } from "@/lib/product-slug";

const createSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200),
  description: z.string().max(20_000).optional().default(""),
  /** Major currency units, e.g. 299.5 for ₹299.50 */
  priceRupees: z.coerce.number().positive("Price must be greater than zero."),
  /** Optional MRP; shown struck through when above selling price. */
  mrpRupees: z.union([z.coerce.number().nonnegative(), z.null()]).optional(),
  /** Optional; if inventory is saved, cover image is set from the first option’s photos. */
  imageUrl: z
    .union([z.string().url(), z.literal("")])
    .optional(),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  /** Optional: create sizes, variants, and stock in the same request. */
  inventory: inventorySchema.optional(),
});

async function uniqueProductSlug(base: string): Promise<string> {
  const root = base || "product";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? root : `${root}-${n}`;
    const row = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!row) return candidate;
    n += 1;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const desc = d.description?.trim() || "No description yet.";
  const imageUrlRaw = d.imageUrl;
  const imageUrl =
    imageUrlRaw === undefined || imageUrlRaw === null
      ? null
      : String(imageUrlRaw).trim() === ""
        ? null
        : String(imageUrlRaw).trim();
  const categoryId =
    d.categoryId && d.categoryId.length > 0 ? d.categoryId : null;

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

  const priceCents = Math.max(1, Math.round(d.priceRupees * 100));
  const mrpCents =
    d.mrpRupees === null || d.mrpRupees === undefined
      ? null
      : Math.max(0, Math.round(d.mrpRupees * 100)) || null;
  const baseSlug = slugFromProductName(d.name);

  if (d.inventory) {
    const err = validateInventoryPayload(d.inventory);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
  }

  try {
    const slug = await uniqueProductSlug(baseSlug);
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: d.name.trim(),
          slug,
          description: desc,
          priceCents,
          mrpCents: mrpCents && mrpCents > 0 ? mrpCents : null,
          currency: "INR",
          imageUrl,
          active: d.active,
          featured: d.featured,
          categoryId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          priceCents: true,
        },
      });
      if (d.inventory) {
        await replaceProductInventory(tx, p.id, d.inventory);
      }
      return p;
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not create product. Is the database configured?" },
      { status: 503 },
    );
  }
}
