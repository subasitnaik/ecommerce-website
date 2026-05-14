import { NextResponse } from "next/server";
import { z } from "zod";
import { finalizeCashfreeOrderIfPaid } from "@/lib/shop-order-create";

const bodySchema = z.object({
  paymentRef: z.string().trim().min(1),
});

/**
 * Marks the storefront order paid after verifying Cashfree order status server-side.
 * Returns the guest tracking credential only when payment succeeded.
 */
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

  try {
    const result = await finalizeCashfreeOrderIfPaid(parsed.data.paymentRef);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      orderNumber: result.orderNumber,
      guestAccessToken: result.guestAccessToken,
      email: result.customerEmail,
      alreadyFinal: result.alreadyFinal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Finalize failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
