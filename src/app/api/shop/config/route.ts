import { NextResponse } from "next/server";
import { getShopSettings } from "@/lib/shop-settings";
import { isCashfreeConfigured } from "@/lib/cashfree-config";

export async function GET() {
  const settings = await getShopSettings();
  return NextResponse.json({
    codEnabled: settings.codEnabled,
    cashfreeConfigured: isCashfreeConfigured(),
  });
}
