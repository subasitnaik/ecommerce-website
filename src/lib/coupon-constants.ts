export const COUPON_TYPE_PERCENT = "percent" as const;
export const COUPON_TYPE_FIXED = "fixed" as const;

export type CouponType = typeof COUPON_TYPE_PERCENT | typeof COUPON_TYPE_FIXED;
