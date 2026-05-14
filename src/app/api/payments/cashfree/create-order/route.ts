import { NextResponse } from "next/server";
import {
  checkoutCartBodySchema,
  totalsForCheckoutCart,
} from "@/lib/checkout-lines";
import {
  cashfreeCreateOrder,
  cashfreeModeForClient,
} from "@/lib/cashfree-server";
import { isCashfreeConfigured } from "@/lib/cashfree-config";
import { prisma } from "@/lib/prisma";
import { createPendingOrderForCashfree } from "@/lib/shop-order-create";

function siteOrigin(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cashfree is not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.",
      },
      { status: 503 },
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

  const d = parsed.data;
  const { lines, customerName, customerEmail, customerPhone } = d;
  const currency = totals.currency;

  const orderAmountRupees = Math.round(totals.totalCents) / 100;
  const paymentRef = `cf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const returnUrl = `${siteOrigin()}/checkout/cashfree/return?order_id={order_id}`;

  const orderNote = lines
    .map((l) => {
      const bits: string[] = [l.name];
      if (l.variantLabel) bits.push(l.variantLabel);
      if (l.size) bits.push(`Size ${l.size}`);
      return `${bits.join(" · ")} × ${l.quantity}`;
    })
    .join("; ")
    .slice(0, 450);

  let createdDbId: string | null = null;
  try {
    const pending = await createPendingOrderForCashfree({
      paymentRef,
      body: parsed.data,
      totals: {
        currency: totals.currency,
        totalCents: totals.totalCents,
      },
    });
    createdDbId = pending.id;

    const { payment_session_id } = await cashfreeCreateOrder({
      orderId: paymentRef,
      orderAmountRupees,
      currency,
      returnUrl,
      customer: {
        customerId: `cust_${parsed.data.customerEmail.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40) || "guest"}`,
        customerName,
        customerEmail,
        customerPhone,
      },
      orderNote,
    });

    return NextResponse.json({
      paymentSessionId: payment_session_id,
      orderId: paymentRef,
      orderNumber: pending.orderNumber,
      mode: cashfreeModeForClient(),
    });
  } catch (e) {
    if (createdDbId) {
      try {
        await prisma.order.delete({ where: { id: createdDbId } });
      } catch {
        /* ignore */
      }
    }
    const message = e instanceof Error ? e.message : "Cashfree error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
