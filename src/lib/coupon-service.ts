import {
  COUPON_TYPE_FIXED,
  COUPON_TYPE_PERCENT,
} from "@/lib/coupon-constants";
import { prisma } from "@/lib/prisma";

export function discountCentsForCoupon(
  type: string,
  value: number,
  subtotalCents: number,
): number {
  if (type === COUPON_TYPE_PERCENT) {
    if (value < 1 || value > 100) return 0;
    return Math.min(subtotalCents, Math.floor((subtotalCents * value) / 100));
  }
  if (type === COUPON_TYPE_FIXED) {
    if (value < 0) return 0;
    return Math.min(subtotalCents, value);
  }
  return 0;
}

export type ValidateCouponResult =
  | { ok: true; code: string; discountCents: number }
  | { ok: false; error: string };

/**
 * Resolves a coupon and returns discount in cents (from the database).
 */
export async function validateCouponForSubtotal(
  rawCode: string,
  subtotalCents: number,
): Promise<ValidateCouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Enter a coupon code." };
  }

  const row = await prisma.coupon.findUnique({ where: { code } });
  if (!row) {
    return { ok: false, error: "This code is not valid." };
  }
  if (!row.active) {
    return { ok: false, error: "This coupon is no longer active." };
  }
  if (row.expiresAt && row.expiresAt < new Date()) {
    return { ok: false, error: "This coupon has expired." };
  }
  if (
    row.minSubtotalCents != null &&
    subtotalCents < row.minSubtotalCents
  ) {
    return {
      ok: false,
      error: "Your order does not meet the minimum for this coupon.",
    };
  }

  const discountCents = discountCentsForCoupon(
    row.type,
    row.value,
    subtotalCents,
  );
  if (discountCents <= 0) {
    return { ok: false, error: "This coupon does not apply to your order." };
  }
  return { ok: true, code, discountCents };
}
