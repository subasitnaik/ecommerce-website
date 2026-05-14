import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { COUPON_TYPE_FIXED, COUPON_TYPE_PERCENT } from "@/lib/coupon-constants";

const createSchema = z.object({
  code: z.string().min(1).max(40).transform((s) => s.trim().toUpperCase()),
  type: z.enum([COUPON_TYPE_PERCENT, COUPON_TYPE_FIXED]),
  value: z.number().int().positive(),
  minSubtotalCents: z.number().int().min(0).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
});

function validateValue(
  type: string,
  value: number,
): { ok: true } | { ok: false; error: string } {
  if (type === COUPON_TYPE_PERCENT) {
    if (value < 1 || value > 100) {
      return { ok: false, error: "Percent must be between 1 and 100." };
    }
  }
  if (type === COUPON_TYPE_FIXED && value < 1) {
    return { ok: false, error: "Fixed amount must be at least 1 paisa." };
  }
  return { ok: true };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const list = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ coupons: list });
  } catch {
    return NextResponse.json(
      { error: "Database not available." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const valueCheck = validateValue(d.type, d.value);
  if (!valueCheck.ok) {
    return NextResponse.json({ error: valueCheck.error }, { status: 400 });
  }

  const expiresAt =
    d.expiresAt === undefined || d.expiresAt === null
      ? null
      : new Date(d.expiresAt);

  try {
    const created = await prisma.coupon.create({
      data: {
        code: d.code,
        type: d.type,
        value: d.value,
        minSubtotalCents: d.minSubtotalCents ?? null,
        expiresAt,
        active: d.active ?? true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const errMsg =
      e && typeof e === "object" && "code" in e && e.code === "P2002"
        ? "A coupon with this code already exists."
        : "Could not create coupon.";
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }
}
