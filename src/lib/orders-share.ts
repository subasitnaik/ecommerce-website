import { siteConfig } from "@/config";

/** Customer-facing prefilled `/orders` link (includes email + access token query). */
export function buildOrdersStatusShareLink(
  email: string,
  guestAccessToken: string,
): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const qs = new URLSearchParams({
    email: email.trim(),
    token: guestAccessToken.trim(),
  }).toString();
  return `${base}/orders?${qs}`;
}
