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
  entries: z
    .array(
      z.object({
        email: z.string().email().trim(),
        guestAccessToken: z.string().uuid().trim(),
      }),
    )
    .min(1)
    .max(50),
});

function dedupe(entries: z.infer<typeof bodySchema>["entries"]) {
  const seen = new Set<string>();
  const out: typeof entries = [];
  for (const e of entries) {
    const k = `${e.email.toLowerCase().trim()}|${e.guestAccessToken.trim()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      email: e.email.toLowerCase().trim(),
      guestAccessToken: e.guestAccessToken.trim(),
    });
  }
  return out;
}

/** List orders tied to checkout credentials saved on this device. */
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

  const entries = dedupe(parsed.data.entries);
  const presets = parseCourierPresets((await getShopSettings()).courierPresets);

  const promises = entries.map(({ email: em, guestAccessToken: tok }) =>
    prisma.order
      .findUnique({
        where: { guestAccessToken: tok },
        select: {
          orderNumber: true,
          status: true,
          totalCents: true,
          currency: true,
          customerEmail: true,
          createdAt: true,
          trackingNumber: true,
          courierPresetId: true,
          _count: { select: { items: true } },
          items: {
            take: 1,
            orderBy: { id: "asc" },
            select: { product: { select: { name: true } } },
          },
        },
      })
      .then((order) => {
        if (
          !order ||
          order.customerEmail?.toLowerCase().trim() !== em.toLowerCase()
        ) {
          return null;
        }
        const wf = normalizeOrderStatus(order.status);
        const resolvedTrackingUrl = resolveCourierTrackingUrl(
          presets,
          order.courierPresetId,
          order.trackingNumber,
        );
        return {
          guestAccessToken: tok,
          orderNumber: order.orderNumber,
          status: order.status,
          statusLabel: orderWorkflowLabel(wf),
          totalCents: order.totalCents,
          currency: order.currency,
          createdAt: order.createdAt.toISOString(),
          trackingNumber: order.trackingNumber,
          resolvedTrackingUrl,
          itemCount: order._count.items,
          primaryItemName: order.items[0]?.product.name ?? null,
        };
      }),
  );

  const rows = await Promise.all(promises);
  const orders = rows.filter(Boolean) as NonNullable<(typeof rows)[number]>[];

  orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return NextResponse.json({ ok: true, orders });
}
