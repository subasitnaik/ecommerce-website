/** Server-only: Cashfree PG credentials from env (Vercel / .env). */
export function isCashfreeConfigured(): boolean {
  return Boolean(
    process.env.CASHFREE_APP_ID?.trim() &&
      process.env.CASHFREE_SECRET_KEY?.trim(),
  );
}

export type CashfreeEnvMode = "sandbox" | "production";

export function getCashfreeEnv(): CashfreeEnvMode {
  const raw = process.env.CASHFREE_ENV?.toLowerCase();
  return raw === "production" ? "production" : "sandbox";
}

export function getCashfreePgBaseUrl(): string {
  return getCashfreeEnv() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}
