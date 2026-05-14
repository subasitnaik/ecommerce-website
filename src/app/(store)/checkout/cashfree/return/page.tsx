"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { sf } from "@/lib/storefront-ui";
import { appendCheckoutToOrdersVault } from "@/lib/orders-vault-session";

function ReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const { clear } = useCart();
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setMessage("Missing order reference.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/payments/cashfree/order-status?order_id=${encodeURIComponent(orderId)}`,
        );
        const data = (await res.json()) as {
          orderStatus?: string;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Could not verify payment");
        }
        const os = (data.orderStatus ?? "").toUpperCase();
        if (cancelled) return;

        if (os === "PAID") {
          const fin = await fetch("/api/payments/cashfree/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentRef: orderId }),
          });
          const finBody = (await fin.json()) as {
            orderNumber?: number;
            guestAccessToken?: string;
            email?: string;
            error?: string;
          };
          if (!fin.ok) {
            throw new Error(finBody.error ?? "Could not confirm your order");
          }
          if (
            typeof finBody.orderNumber !== "number" ||
            typeof finBody.guestAccessToken !== "string"
          ) {
            throw new Error("Unexpected confirmation response");
          }
          appendCheckoutToOrdersVault({
            email: (finBody.email ?? "").trim().toLowerCase(),
            token: finBody.guestAccessToken,
            orderNumber: finBody.orderNumber,
          });
          clear();
          setStatus("paid");
          router.replace(
            `/checkout/success?method=paid&order=${finBody.orderNumber}`,
          );
          return;
        }

        if (os === "ACTIVE" || os === "PENDING") {
          setStatus("pending");
          setMessage(
            "Payment is still processing. Refresh this page in a moment.",
          );
        } else {
          setStatus("pending");
          setMessage(`Order status: ${data.orderStatus ?? "unknown"}`);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setMessage(e instanceof Error ? e.message : "Verification failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, clear, router]);

  return (
    <div className={sf.pageCenter}>
      {status === "loading" ? (
        <p className={sf.sub}>Verifying payment…</p>
      ) : null}
      {status === "paid" ? (
        <p className={sf.sub}>Redirecting to confirmation…</p>
      ) : null}
      {status === "pending" ? (
        <>
          <h1 className={sf.h1Lg}>Payment status</h1>
          <p className={`${sf.sub} mt-3`}>{message}</p>
        </>
      ) : null}
      {status === "error" ? (
        <>
          <h1 className={sf.h1Lg}>Something went wrong</h1>
          <p className="mt-3 border-l-2 border-neutral-900 pl-2 text-base text-neutral-900 dark:border-neutral-100 dark:text-neutral-50">
            {message}
          </p>
        </>
      ) : null}

      <Link href="/products" className={`${sf.btnBlack} mt-8`}>
        Continue shopping
      </Link>
    </div>
  );
}

export default function CashfreeReturnPage() {
  return (
    <Suspense
      fallback={
        <div className={sf.pageCenter}>
          <p className={sf.sub}>Loading…</p>
        </div>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}
