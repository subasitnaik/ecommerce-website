"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { sf } from "@/lib/storefront-ui";

function TrackHint() {
  const sp = useSearchParams();
  const order = sp.get("order");

  return (
    <>
      {order ? (
        <p className={`${sf.body} mt-2 text-base`}>
          Order <span className="font-semibold tabular-nums">#{order}</span>
        </p>
      ) : null}
      <p className={`${sf.sub} mt-4 max-w-md text-sm`}>
        Open <span className="font-medium">Order status</span> to see this order
        on this device — we save the access record in this browser when you
        complete checkout.
      </p>
      <Link
        href="/orders"
        className={`${sf.btnBlack} mt-8 inline-flex min-w-[11rem] justify-center`}
      >
        Order status
      </Link>
    </>
  );
}

export function CheckoutSuccessExtras() {
  return (
    <Suspense fallback={null}>
      <TrackHint />
    </Suspense>
  );
}
