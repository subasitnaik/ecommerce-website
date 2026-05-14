import { NextResponse } from "next/server";
import {
  checkoutCartBodySchema,
  totalsForCheckoutCart,
} from "@/lib/checkout-lines";
import { createCodPaidOrder } from "@/lib/shop-order-create";
import { getShopSettings } from "@/lib/shop-settings";

export const runtime = "nodejs";

/** Place a COD order (persists Order + lines). */
export async function POST(request: Request) {
  const settings = await getShopSettings();
  if (!settings.codEnabled) {
    return NextResponse.json(
      { error: "Cash on delivery is disabled for this shop." },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutCartBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const totals = await totalsForCheckoutCart(parsed.data);
  if (!totals.ok) {
    return NextResponse.json({ error: totals.error }, { status: 400 });
  }

  try {
    const created = await createCodPaidOrder({
      body: parsed.data,
      totals: {
        currency: totals.currency,
        totalCents: totals.totalCents,
      },
    });
    return NextResponse.json({
      orderNumber: created.orderNumber,
      guestAccessToken: created.guestAccessToken,
      email: created.customerEmail,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create order";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
