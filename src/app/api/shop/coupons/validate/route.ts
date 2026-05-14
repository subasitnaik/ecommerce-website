import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCouponForSubtotal } from "@/lib/coupon-service";

const bodySchema = z.object({
  code: z.string().min(1).max(64),
  subtotalCents: z.number().int().min(0),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { code, subtotalCents } = parsed.data;
  try {
    const result = await validateCouponForSubtotal(code, subtotalCents);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      code: result.code,
      discountCents: result.discountCents,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not check coupon. Is the database configured?" },
      { status: 503 },
    );
  }
}
