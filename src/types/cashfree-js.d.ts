declare module "@cashfreepayments/cashfree-js" {
  export function load(
    ...args: unknown[]
  ): Promise<{
    checkout: (opts: { paymentSessionId: string }) => Promise<void>;
  } | null>;
}
