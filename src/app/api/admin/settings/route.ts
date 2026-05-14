import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STORED_SHOP_NAME_FONT_IDS } from "@/lib/shop-name-fonts";
import {
  MAX_HOME_HIGHLIGHT_RAILS,
  normalizeHomeHighlightRailTokens,
  railsStorageStringsFromSettings,
} from "@/types/home";

const slideSchema = z.object({
  imageUrl: z.string().min(1),
  href: z.string().optional(),
  alt: z.string().optional(),
});

const courierPresetPatchSchema = z.object({
  id: z.string().min(2).max(64),
  name: z.string().min(1).max(80).trim(),
  urlTemplate: z
    .string()
    .min(12)
    .max(2048)
    .refine((s) => s.includes("{{awb}}"), {
      message: 'URL template must include {{awb}}',
    }),
});

const singleRailTokenSchema = z
  .union([
    z.literal("bestsellers"),
    z.literal("featured"),
    z.literal("random"),
    z.literal("all"),
    z
      .string()
      .regex(/^category:.+/u)
      .max(280)
      .refine((s) => s.slice("category:".length).trim().length > 0, {
        message: "Category slug cannot be empty",
      }),
  ])
  .transform((s) =>
    s === "featured" || s === "random" || s === "all" ? "bestsellers" : s,
  );

const homeProductModeSchema = singleRailTokenSchema;

const homeHighlightRailsSchema = z
  .array(singleRailTokenSchema)
  .max(MAX_HOME_HIGHLIGHT_RAILS)
  .transform((arr) => {
    const n = normalizeHomeHighlightRailTokens(arr);
    return n.length > 0 ? n : (["bestsellers"] as string[]);
  });

const patchSchema = z.object({
  codEnabled: z.boolean().optional(),
  carouselSlides: z.array(slideSchema).max(10).optional(),
  homeHighlightRails: homeHighlightRailsSchema.optional(),
  homeProductMode: homeProductModeSchema.optional(),
  homeProductsPerPage: z.number().int().min(3).max(24).optional(),
  /** null = site default (body) font. Non-null ids are from `SHOP_NAME_FONTS` (not `default`). */
  shopNameFont: z.union([z.null(), z.enum(STORED_SHOP_NAME_FONT_IDS)]).optional(),
  courierPresets: z.array(courierPresetPatchSchema).max(12).optional(),
});

export async function PATCH(request: Request) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const hasUpdate =
    d.codEnabled !== undefined ||
    d.carouselSlides !== undefined ||
    d.homeHighlightRails !== undefined ||
    d.homeProductMode !== undefined ||
    d.homeProductsPerPage !== undefined ||
    d.shopNameFont !== undefined ||
    d.courierPresets !== undefined;

  if (!hasUpdate) {
    return NextResponse.json(
      { error: "No supported fields to update" },
      { status: 400 },
    );
  }

  const update: Prisma.ShopSettingsUpdateInput = {};
  if (d.codEnabled !== undefined) update.codEnabled = d.codEnabled;
  if (d.carouselSlides !== undefined) {
    update.carouselSlides = d.carouselSlides as Prisma.InputJsonValue;
  }

  let resolvedRails: string[] | undefined;
  if (d.homeHighlightRails !== undefined) {
    resolvedRails = d.homeHighlightRails;
    update.homeHighlightRails =
      resolvedRails as unknown as Prisma.InputJsonValue;
    update.homeProductMode = resolvedRails[0] ?? "bestsellers";
  } else if (d.homeProductMode !== undefined) {
    update.homeProductMode = d.homeProductMode;
    resolvedRails = [d.homeProductMode];
    update.homeHighlightRails =
      resolvedRails as unknown as Prisma.InputJsonValue;
  }

  if (d.homeProductsPerPage !== undefined) {
    update.homeProductsPerPage = d.homeProductsPerPage;
  }
  if (d.shopNameFont !== undefined) {
    update.shopNameFont = d.shopNameFont;
  }
  if (d.courierPresets !== undefined) {
    update.courierPresets =
      d.courierPresets as unknown as Prisma.InputJsonValue;
  }

  const defaultRails =
    resolvedRails ??
    normalizeHomeHighlightRailTokens(["bestsellers"]);

  try {
    const updated = await prisma.shopSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        codEnabled: d.codEnabled ?? true,
        carouselSlides: (d.carouselSlides ?? []) as Prisma.InputJsonValue,
        homeHighlightRails:
          defaultRails as unknown as Prisma.InputJsonValue,
        homeProductMode: defaultRails[0] ?? "bestsellers",
        homeProductsPerPage: d.homeProductsPerPage ?? 6,
        shopNameFont: d.shopNameFont ?? null,
        ...(d.courierPresets !== undefined && {
          courierPresets:
            d.courierPresets as unknown as Prisma.InputJsonValue,
        }),
      },
      update,
    });

    const railsOut = railsStorageStringsFromSettings(
      updated.homeHighlightRails,
      updated.homeProductMode,
    );

    return NextResponse.json({
      codEnabled: updated.codEnabled,
      carouselSlides: updated.carouselSlides,
      homeHighlightRails: railsOut,
      homeProductMode: updated.homeProductMode,
      homeProductsPerPage: updated.homeProductsPerPage,
      shopNameFont: updated.shopNameFont,
      courierPresets: updated.courierPresets,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Database not configured — set DATABASE_URL and run migrations to persist settings.",
      },
      { status: 503 },
    );
  }
}
