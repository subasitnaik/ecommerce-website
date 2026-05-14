"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { useCart } from "@/components/cart/cart-context";
import { formatMoney } from "@/lib/format";
import { formatCartLineOptions } from "@/lib/product-options";
import { sf } from "@/lib/storefront-ui";
import { appendCheckoutToOrdersVault } from "@/lib/orders-vault-session";

type ShopConfig = {
  codEnabled: boolean;
  cashfreeConfigured: boolean;
};

const labelClass = "text-xs font-medium text-neutral-500 dark:text-neutral-400";

export default function CheckoutClient({
  initialShopConfig,
}: {
  initialShopConfig: ShopConfig;
}) {
  const router = useRouter();
  const {
    lines,
    ready,
    subtotalCents,
    discountCents,
    totalCents,
    appliedCoupon,
    clear,
  } = useCart();
  const currency = lines[0]?.currency ?? "INR";

  const [shopConfig, setShopConfig] = useState(initialShopConfig);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingLine2, setShippingLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [codLoading, setCodLoading] = useState(false);

  useEffect(() => {
    fetch("/api/shop/config")
      .then((r) => r.json())
      .then((data: ShopConfig) => setShopConfig(data))
      .catch(() => {});
  }, []);

  const handleCashfreePay = useCallback(async () => {
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await fetch("/api/payments/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.replace(/\s/g, ""),
          shippingLine1: shippingLine1.trim(),
          ...(shippingLine2.trim()
            ? { shippingLine2: shippingLine2.trim() }
            : {}),
          shippingCity: shippingCity.trim(),
          shippingState: shippingState.trim(),
          shippingPostalCode: shippingPostalCode.replace(/\s/g, "").trim(),
          ...(appliedCoupon
            ? { couponCode: appliedCoupon.code }
            : {}),
        }),
      });
      const data = (await res.json()) as {
        paymentSessionId?: string;
        mode?: "sandbox" | "production";
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not start payment");
      }
      if (!data.paymentSessionId) {
        throw new Error("Missing payment session");
      }

      const mode = data.mode ?? "sandbox";
      const cashfree = await load({ mode } as never);
      if (
        !cashfree ||
        typeof (cashfree as { checkout?: unknown }).checkout !== "function"
      ) {
        throw new Error("Cashfree.js failed to load");
      }
      await (
        cashfree as {
          checkout: (opts: { paymentSessionId: string }) => Promise<void>;
        }
      ).checkout({
        paymentSessionId: data.paymentSessionId,
      });
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPayLoading(false);
    }
  }, [
    lines,
    customerName,
    customerEmail,
    customerPhone,
    shippingLine1,
    shippingLine2,
    shippingCity,
    shippingState,
    shippingPostalCode,
    appliedCoupon,
  ]);

  const handleCod = useCallback(async () => {
    setPayError(null);
    if (!shopConfig.codEnabled || lines.length === 0) return;
    if (
      !customerName.trim() ||
      !customerEmail.includes("@") ||
      customerPhone.replace(/\s/g, "").length < 10 ||
      !shippingLine1.trim() ||
      !shippingCity.trim() ||
      !shippingState.trim() ||
      !/^\d{6}$/.test(shippingPostalCode.replace(/\s/g, "").trim())
    ) {
      setPayError(
        "Please fill in contact details and a full shipping address (6-digit PIN for India).",
      );
      return;
    }
    setCodLoading(true);
    try {
      const res = await fetch("/api/shop/orders/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.replace(/\s/g, ""),
          shippingLine1: shippingLine1.trim(),
          ...(shippingLine2.trim()
            ? { shippingLine2: shippingLine2.trim() }
            : {}),
          shippingCity: shippingCity.trim(),
          shippingState: shippingState.trim(),
          shippingPostalCode: shippingPostalCode.replace(/\s/g, "").trim(),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
      });
      const data = (await res.json()) as {
        orderNumber?: number;
        guestAccessToken?: string;
        email?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not place order");
      }
      if (
        typeof data.orderNumber !== "number" ||
        typeof data.guestAccessToken !== "string"
      ) {
        throw new Error("Unexpected response from server");
      }
      appendCheckoutToOrdersVault({
        email: (data.email ?? customerEmail).trim().toLowerCase(),
        token: data.guestAccessToken,
        orderNumber: data.orderNumber,
      });
      clear();
      router.push(`/checkout/success?method=cod&order=${data.orderNumber}`);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setCodLoading(false);
    }
  }, [
    shopConfig.codEnabled,
    lines,
    customerName,
    customerEmail,
    customerPhone,
    shippingLine1,
    shippingLine2,
    shippingCity,
    shippingState,
    shippingPostalCode,
    appliedCoupon,
    clear,
    router,
  ]);

  if (!ready) {
    return (
      <div className={sf.pageNarrow}>
        <p className={`${sf.sub} py-32 text-center`}>Loading…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className={`${sf.pageNarrow} text-center`}>
        <h1 className={sf.h1Lg}>Your bag is empty</h1>
        <Link href="/products" className={`${sf.linkMuted} mt-6 inline-block`}>
          Browse products
        </Link>
      </div>
    );
  }

  const pinNormalized = shippingPostalCode.replace(/\s/g, "").trim();
  const shippingAddressReady =
    shippingLine1.trim().length > 0 &&
    shippingCity.trim().length > 0 &&
    shippingState.trim().length > 0 &&
    /^\d{6}$/.test(pinNormalized);

  const canPayOnline =
    shopConfig.cashfreeConfigured &&
    customerName.trim().length > 0 &&
    customerEmail.includes("@") &&
    customerPhone.replace(/\s/g, "").length >= 10 &&
    shippingAddressReady;

  const canPlaceCod =
    shopConfig.codEnabled &&
    customerName.trim().length > 0 &&
    customerEmail.includes("@") &&
    customerPhone.replace(/\s/g, "").length >= 10 &&
    shippingAddressReady;

  return (
    <div className={sf.pageNarrow}>
      <div>
        <h1 className={sf.h1Lg}>Checkout</h1>
        <p className={`${sf.body} mt-3 max-w-2xl text-sm sm:text-base`}>
          Pay with Cashfree (UPI, cards, net banking). For live payments, add
          your keys in{" "}
          <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[0.8rem] text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
            .env
          </code>
          .
        </p>
      </div>

      <div className={`${sf.card} mt-8 overflow-hidden`}>
        <div className="border-b border-black/10 px-5 py-4 dark:border-white/10 sm:px-6 sm:py-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
            Order summary
          </h2>
          <ul className="mt-4 space-y-2.5">
            {lines.map((line) => {
              const meta = formatCartLineOptions(line);
              return (
              <li
                key={line.lineId}
                className="flex justify-between gap-3 text-[0.95rem] leading-snug"
              >
                <span className="min-w-0 text-neutral-600 dark:text-neutral-300">
                  <span className="block">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {line.name}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-500">
                      {" "}
                      × {line.quantity}
                    </span>
                  </span>
                  {meta ? (
                    <span className="mt-0.5 block text-[0.85rem] text-neutral-500 dark:text-neutral-500">
                      {meta}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatMoney(line.priceCents * line.quantity, line.currency)}
                </span>
              </li>
            );
            })}
          </ul>
          {discountCents > 0 ? (
            <>
              <div className="mt-3 flex justify-between gap-3 text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
                <span className="tabular-nums text-neutral-800 dark:text-neutral-200">
                  {formatMoney(subtotalCents, currency)}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3 text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Discount
                  {appliedCoupon ? ` (${appliedCoupon.code})` : ""}
                </span>
                <span className="tabular-nums text-neutral-800 dark:text-neutral-200">
                  −{formatMoney(discountCents, currency)}
                </span>
              </div>
            </>
          ) : null}
          <div className="mt-4 flex items-baseline justify-between border-t border-black/5 pt-4 dark:border-white/10">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Total
            </span>
            <span className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
              {formatMoney(totalCents, currency)}
            </span>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
            Contact
          </h3>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={sf.input}
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className={sf.input}
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                Phone (10-digit Indian mobile, no country code — required for
                Cashfree)
              </span>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={sf.input}
                autoComplete="tel"
                placeholder="9876543210"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-black/10 px-5 py-5 dark:border-white/10 sm:px-6 sm:py-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
            Shipping address
          </h3>
          <p className={`${labelClass} mt-2 leading-relaxed`}>
            We deliver across India — use your complete address and a 6-digit
            PIN.
          </p>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className={labelClass}>Address line 1</span>
              <input
                type="text"
                value={shippingLine1}
                onChange={(e) => setShippingLine1(e.target.value)}
                className={sf.input}
                autoComplete="address-line1"
                placeholder="House / street / area"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Address line 2 (optional)</span>
              <input
                type="text"
                value={shippingLine2}
                onChange={(e) => setShippingLine2(e.target.value)}
                className={sf.input}
                autoComplete="address-line2"
                placeholder="Landmark, flat, wing…"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>City / town</span>
                <input
                  type="text"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  className={sf.input}
                  autoComplete="address-level2"
                />
              </label>
              <label className="block">
                <span className={labelClass}>State</span>
                <input
                  type="text"
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  className={sf.input}
                  autoComplete="address-level1"
                />
              </label>
            </div>
            <label className="block max-w-xs">
              <span className={labelClass}>PIN code</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={shippingPostalCode}
                onChange={(e) =>
                  setShippingPostalCode(e.target.value.replace(/\D/g, ""))
                }
                className={sf.input}
                autoComplete="postal-code"
                placeholder="560001"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-black/10 bg-neutral-50/50 px-5 py-5 dark:border-white/10 dark:bg-neutral-950/40 sm:px-6 sm:py-6">
          {payError ? (
            <p className="mb-3 border-l-2 border-neutral-900 pl-2 text-sm text-neutral-900 dark:border-neutral-100 dark:text-neutral-100">
              {payError}
            </p>
          ) : null}

          {!shopConfig.cashfreeConfigured ? (
            <p className="mb-3 rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-sm leading-snug text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100">
              Online payments are off until you set{" "}
              <code className="rounded bg-neutral-200/90 px-1 text-xs text-neutral-950 dark:bg-neutral-800 dark:text-neutral-100">
                CASHFREE_APP_ID
              </code>{" "}
              and{" "}
              <code className="rounded bg-neutral-200/90 px-1 text-xs text-neutral-950 dark:bg-neutral-800 dark:text-neutral-100">
                CASHFREE_SECRET_KEY
              </code>{" "}
              (sandbox is fine for testing).
            </p>
          ) : null}

          <button
            type="button"
            disabled={!canPayOnline || payLoading}
            onClick={() => void handleCashfreePay()}
            className="flex h-12 w-full items-center justify-center rounded-md bg-black text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
          >
            {payLoading ? "…" : "Pay with Cashfree"}
          </button>

          {shopConfig.codEnabled ? (
            <div className="mt-4">
              <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
                or
              </p>
              <button
                type="button"
                disabled={!canPlaceCod || codLoading}
                onClick={() => void handleCod()}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-md border border-neutral-300 bg-white/90 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/80 dark:disabled:opacity-40"
              >
                {codLoading ? "…" : "Cash on delivery"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1 text-center sm:gap-0">
        <button
          type="button"
          onClick={() => clear()}
          className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Clear bag
        </button>
        <Link
          href="/cart"
          className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Back to bag
        </Link>
      </div>
    </div>
  );
}
