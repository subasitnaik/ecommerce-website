import type { ShopSettings } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const offlineDefaults: ShopSettings = {
  id: "default",
  codEnabled: true,
  carouselSlides: null,
  homeHighlightRails: null,
  homeProductMode: "bestsellers",
  homeProductsPerPage: 6,
  shopNameFont: null,
  courierPresets: null,
  updatedAt: new Date(0),
};

export async function getShopSettings(): Promise<ShopSettings> {
  try {
    const row = await prisma.shopSettings.findUnique({
      where: { id: "default" },
    });
    if (row) return row;
    return prisma.shopSettings.create({
      data: {
        id: "default",
        codEnabled: true,
        homeProductMode: "bestsellers",
        homeHighlightRails: ["bestsellers"],
        homeProductsPerPage: 6,
        shopNameFont: null,
      },
    });
  } catch {
    return offlineDefaults;
  }
}
