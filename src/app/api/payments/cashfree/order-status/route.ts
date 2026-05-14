import { NextResponse } from "next/server";
import { cashfreeGetOrder } from "@/lib/cashfree-server";
import { isCashfreeConfigured } from "@/lib/cashfree-config";

export async function GET(request: Request) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json({ error: "Cashfree not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id")?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "order_id required" }, { status: 400 });
  }

  try {
    const order = await cashfreeGetOrder(orderId);
    return NextResponse.json({
      orderId: order.order_id ?? orderId,
      orderStatus: order.order_status ?? "UNKNOWN",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch order";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
