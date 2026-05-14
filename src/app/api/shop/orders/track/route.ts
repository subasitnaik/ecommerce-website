import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  parseCourierPresets,
  resolveCourierTrackingUrl,
} from "@/lib/courier-presets";
import {
  normalizeOrderStatus,
  orderWorkflowLabel,
} from "@/lib/order-workflow";
import { getShopSettings } from "@/lib/shop-settings";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().trim(),
  guestAccessToken: z.string().uuid().trim(),
});

/** Legacy single-order lookup (email + guest token). Prefer list/detail hubs. */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const token = parsed.data.guestAccessToken;

  const order = await prisma.order.findUnique({
    where: { guestAccessToken: token },
    select: {
      orderNumber: true,
      status: true,
      totalCents: true,
      currency: true,
      customerEmail: true,
      createdAt: true,
      paymentProvider: true,
      trackingNumber: true,
      courierPresetId: true,
    },
  });

  if (!order || order.customerEmail?.toLowerCase().trim() !== email) {
    return NextResponse.json(
      { error: "We could not find an order with those details." },
      { status: 404 },
    );
  }

  const wf = normalizeOrderStatus(order.status);
  const presets = parseCourierPresets((await getShopSettings()).courierPresets);

  let courierLabel: string | null = null;
  if (order.courierPresetId) {
    const p = presets.find((x) => x.id === order.courierPresetId);
    courierLabel = p?.name ?? null;
  }

  const resolvedTrackingUrl = resolveCourierTrackingUrl(
    presets,
    order.courierPresetId,
    order.trackingNumber,
  );

  return NextResponse.json({
    ok: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: orderWorkflowLabel(wf),
      totalCents: order.totalCents,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      paymentProvider: order.paymentProvider,
      trackingNumber: order.trackingNumber,
      courierLabel,
      resolvedTrackingUrl,
    },
  });
}
