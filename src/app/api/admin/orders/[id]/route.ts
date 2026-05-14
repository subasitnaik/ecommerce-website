import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAdminOrderById } from "@/lib/admin-orders";
import { validateAdminOrderStatusTransition } from "@/lib/admin-order-status-transitions";
import { parseCourierPresets } from "@/lib/courier-presets";
import {
  normalizeOrderStatus,
  type OrderWorkflowStatus,
} from "@/lib/order-workflow";
import { getShopSettings } from "@/lib/shop-settings";

export const runtime = "nodejs";

/** Must match `ORDER_WORKFLOW_VALUES` in order-workflow.ts */
const workflowStatuses = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const patchBody = z
  .object({
    status: z.enum(workflowStatuses).optional(),
    trackingNumber: z.union([z.string().max(160), z.null()]).optional(),
    courierPresetId: z
      .union([z.string().min(2).max(64), z.null()])
      .optional(),
  })
  .refine(
    (d) =>
      d.status !== undefined ||
      d.trackingNumber !== undefined ||
      d.courierPresetId !== undefined,
    { message: "Nothing to update" },
  );

function normalizeTrackingNumber(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

/** Read-only detail for `/admin/orders/[id]`. */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const order = await getAdminOrderById(decodeURIComponent(id));
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const presets = parseCourierPresets((await getShopSettings()).courierPresets);
  const courierPresetName = order.courierPresetId
    ? presets.find((p) => p.id === order.courierPresetId)?.name ?? null
    : null;

  return NextResponse.json({
    ok: true as const,
    order,
    courierPresetName,
  });
}

/** Update order status and/or storefront shipment tracking (admin). */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const tn = normalizeTrackingNumber(parsed.data.trackingNumber);
  let pid: string | null | undefined;

  if (parsed.data.courierPresetId !== undefined) {
    if (parsed.data.courierPresetId === null) pid = null;
    else pid = parsed.data.courierPresetId.trim() || null;
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true,
      trackingNumber: true,
      courierPresetId: true,
    },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Order not found or could not update." },
      { status: 404 },
    );
  }

  const prev = normalizeOrderStatus(existing.status);
  const mergedTN =
    tn === undefined ? existing.trackingNumber : tn ?? null;
  const mergedPID =
    pid === undefined ? existing.courierPresetId : pid ?? null;

  const onlyTrackingPatch =
    parsed.data.status === undefined &&
    (tn !== undefined || pid !== undefined);

  if (onlyTrackingPatch) {
    if (prev === "processing") {
      return NextResponse.json(
        {
          error:
            "Use “Save tracking” from the ship step to add AWB and courier while the order is Processing.",
        },
        { status: 400 },
      );
    }
    if (prev !== "shipped") {
      return NextResponse.json(
        { error: "Tracking can only be edited for Shipped orders." },
        { status: 400 },
      );
    }
  }

  if (parsed.data.status !== undefined) {
    const next = parsed.data.status as OrderWorkflowStatus;
    const err = validateAdminOrderStatusTransition(prev, next, {
      mergedTN,
      mergedPID,
    });
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
  }

  const data: {
    status?: string;
    trackingNumber?: string | null;
    courierPresetId?: string | null;
    adminSeenAt: Date;
  } = {
    adminSeenAt: new Date(),
  };

  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (tn !== undefined) data.trackingNumber = tn;
  if (pid !== undefined) data.courierPresetId = pid ?? null;

  try {
    const updated = await prisma.order.update({
      where: { id },
      data,
      select: {
        id: true,
        status: true,
        trackingNumber: true,
        courierPresetId: true,
        adminSeenAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Order not found or could not update." },
      { status: 404 },
    );
  }
}
