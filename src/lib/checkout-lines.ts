import { z } from "zod";
import { validateCouponForSubtotal } from "@/lib/coupon-service";

/** Cart line as sent from checkout (matches Cashfree create-order body). */
export const checkoutLineSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  priceCents: z.number().int().min(0),
  currency: z.string().min(1),
  lineId: z.string().max(200).optional(),
  size: z.string().max(64).nullish(),
  sizeId: z.string().max(80).nullish(),
  sizeLabel: z.string().max(64).nullish(),
  variantId: z.string().max(80).nullish(),
  variantLabel: z.string().max(120).nullish(),
});

export const checkoutCartBodySchema = z
  .object({
    lines: z.array(checkoutLineSchema).min(1),
    customerName: z.string().min(1).max(120).transform((s) => s.trim()),
    customerEmail: z.string().email(),
    customerPhone: z
      .string()
      .min(10)
      .max(15)
      .transform((s) => s.replace(/\s/g, "")),
    shippingLine1: z.string().min(1).max(220).transform((s) => s.trim()),
    shippingLine2: z
      .string()
      .max(220)
      .optional()
      .transform((s) => {
        const t = s?.trim();
        return t && t.length > 0 ? t : undefined;
      }),
    shippingCity: z.string().min(1).max(120).transform((s) => s.trim()),
    shippingState: z.string().min(1).max(120).transform((s) => s.trim()),
    shippingPostalCode: z.string().min(4).max(16).transform((s) => s.trim()),
    shippingCountry: z.string().length(2).optional(),
    couponCode: z.string().max(64).nullish(),
  })
  .superRefine((d, ctx) => {
    const c = ((d.shippingCountry ?? "IN").trim().toUpperCase() || "IN") as string;
    if (c === "IN") {
      if (!/^\d{6}$/.test(d.shippingPostalCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use a valid 6-digit PIN code.",
          path: ["shippingPostalCode"],
        });
      }
    }
  })
  .transform((d) => ({
    ...d,
    shippingCountry: (d.shippingCountry ?? "IN").trim().toUpperCase() || "IN",
    customerEmail: d.customerEmail.trim().toLowerCase(),
  }));

export type CheckoutCartParsed = z.infer<typeof checkoutCartBodySchema>;

export type CheckoutTotalsResult =
  | {
      ok: true;
      currency: string;
      subtotalCents: number;
      totalCents: number;
      couponCode?: string;
    }
  | { ok: false; error: string };

export async function totalsForCheckoutCart(
  d: CheckoutCartParsed,
): Promise<CheckoutTotalsResult> {
  const { lines } = d;
  const currency = lines[0]?.currency ?? "INR";
  if (lines.some((l) => l.currency !== currency)) {
    return { ok: false, error: "All cart lines must use the same currency" };
  }

  const subtotalCents = lines.reduce(
    (sum, l) => sum + l.priceCents * l.quantity,
    0,
  );
  if (subtotalCents < 100) {
    return {
      ok: false,
      error: "Order total must be at least 1.00 in your currency",
    };
  }

  const couponCodeRaw = d.couponCode?.trim();
  const couponCode =
    couponCodeRaw && couponCodeRaw.length > 0
      ? couponCodeRaw.toUpperCase()
      : undefined;

  let totalCents = subtotalCents;
  if (couponCode) {
    try {
      const applied = await validateCouponForSubtotal(
        couponCode,
        subtotalCents,
      );
      if (!applied.ok) return { ok: false, error: applied.error };
      totalCents = subtotalCents - applied.discountCents;
    } catch {
      return {
        ok: false,
        error: "Could not apply coupon. Try again or remove the code.",
      };
    }
  }

  if (totalCents < 100) {
    return {
      ok: false,
      error:
        "Order total after discount must be at least 1.00 in your currency",
    };
  }

  return {
    ok: true,
    currency,
    subtotalCents,
    totalCents,
    couponCode,
  };
}
