import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { CheckoutCartParsed } from "@/lib/checkout-lines";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createPendingOrderForCashfree(opts: {
  paymentRef: string;
  body: CheckoutCartParsed;
  totals: { currency: string; totalCents: number };
}) {
  const { paymentRef, body, totals } = opts;
  const guestAccessToken = randomUUID();
  return prisma.order.create({
    data: {
      guestAccessToken,
      status: "pending_payment",
      totalCents: totals.totalCents,
      currency: totals.currency,
      customerEmail: normalizeEmail(body.customerEmail),
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      shippingLine1: body.shippingLine1,
      shippingLine2: body.shippingLine2 ?? null,
      shippingCity: body.shippingCity,
      shippingState: body.shippingState,
      shippingPostalCode: body.shippingPostalCode,
      shippingCountry: body.shippingCountry,
      paymentRef,
      items: {
        create: body.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          priceCents: l.priceCents,
          size: l.size ?? l.sizeLabel ?? null,
          variantId: l.variantId ?? null,
          variantLabel: l.variantLabel ?? null,
        })),
      },
    },
    select: { id: true, orderNumber: true },
  });
}

export async function createCodPaidOrder(opts: {
  body: CheckoutCartParsed;
  totals: { currency: string; totalCents: number };
}) {
  const { body, totals } = opts;
  const guestAccessToken = randomUUID();
  return prisma.order.create({
    data: {
      guestAccessToken,
      status: "paid",
      totalCents: totals.totalCents,
      currency: totals.currency,
      customerEmail: normalizeEmail(body.customerEmail),
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      shippingLine1: body.shippingLine1,
      shippingLine2: body.shippingLine2 ?? null,
      shippingCity: body.shippingCity,
      shippingState: body.shippingState,
      shippingPostalCode: body.shippingPostalCode,
      shippingCountry: body.shippingCountry,
      paymentProvider: "cod",
      items: {
        create: body.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          priceCents: l.priceCents,
          size: l.size ?? l.sizeLabel ?? null,
          variantId: l.variantId ?? null,
          variantLabel: l.variantLabel ?? null,
        })),
      },
    },
    select: {
      id: true,
      orderNumber: true,
      guestAccessToken: true,
      customerEmail: true,
    },
  });
}

export async function finalizeCashfreeOrderIfPaid(paymentRef: string): Promise<
  | {
      ok: true;
      orderNumber: number;
      guestAccessToken: string;
      customerEmail: string | null;
      alreadyFinal: boolean;
    }
  | { ok: false; error: string }
> {
  const order = await prisma.order.findUnique({
    where: { paymentRef },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      guestAccessToken: true,
      customerEmail: true,
    },
  });
  if (!order) {
    return { ok: false, error: "Order not found" };
  }

  if (order.status !== "pending_payment") {
    return {
      ok: true,
      orderNumber: order.orderNumber,
      guestAccessToken: order.guestAccessToken,
      customerEmail: order.customerEmail,
      alreadyFinal: true,
    };
  }

  const { cashfreeGetOrder } = await import("@/lib/cashfree-server");
  const cf = await cashfreeGetOrder(paymentRef);
  const os = String(cf.order_status ?? "").toUpperCase();
  if (os !== "PAID") {
    return {
      ok: false,
      error: `Payment not completed (${cf.order_status ?? "unknown"})`,
    };
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "paid", paymentProvider: "cashfree" },
    select: {
      orderNumber: true,
      guestAccessToken: true,
      customerEmail: true,
    },
  });

  return {
    ok: true,
    orderNumber: updated.orderNumber,
    guestAccessToken: updated.guestAccessToken,
    customerEmail: updated.customerEmail,
    alreadyFinal: false,
  };
}
