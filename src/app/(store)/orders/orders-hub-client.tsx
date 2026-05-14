"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { VaultOrderRef } from "@/lib/orders-vault";
import {
  appendLookupToOrdersVault,
  readVaultOrderRefs,
} from "@/lib/orders-vault-session";
import {
  storefrontOrdersLayoutPreviewDetail,
  storefrontOrdersLayoutPreviewRefs,
  storefrontOrdersLayoutPreviewSummariesByToken,
} from "@/lib/mock-storefront-orders-layout";
import {
  normalizeOrderStatus,
  orderWorkflowLabel,
  type OrderWorkflowStatus,
} from "@/lib/order-workflow";
import { formatMoney } from "@/lib/format";
import { sf } from "@/lib/storefront-ui";
import {
  HiOutlineArrowLeft,
  HiOutlineChevronRight,
  HiOutlineSearch,
} from "react-icons/hi";

type ListOrderSummary = {
  guestAccessToken: string;
  orderNumber: number;
  status: string;
  statusLabel: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  trackingNumber: string | null;
  resolvedTrackingUrl: string | null;
  itemCount: number;
  primaryItemName: string | null;
};

type DetailLine = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  size: string | null;
  variantLabel: string | null;
};

type DetailOrder = {
  orderNumber: number;
  status: string;
  statusLabel: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentProvider: string | null;
  trackingNumber: string | null;
  courierLabel: string | null;
  resolvedTrackingUrl: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  items: DetailLine[];
};

function formatOrderDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDetailPlaced(iso: string) {
  return `Placed ${formatOrderDateShort(iso)}`;
}

function listPreviewSubtitle(
  s: Pick<ListOrderSummary, "itemCount" | "primaryItemName">,
): string {
  const n = typeof s.itemCount === "number" ? s.itemCount : 0;
  const primary = (s.primaryItemName ?? "").trim();
  if (n <= 0 && !primary) return "Items in this order";
  if (n <= 1) return primary || "1 item";
  const tail = primary || "more items";
  return `${n} items · ${tail}`;
}

function formatStoredShippingLines(o: {
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
}): string | null {
  const lines: string[] = [];
  if (o.shippingLine1?.trim()) lines.push(o.shippingLine1.trim());
  if (o.shippingLine2?.trim()) lines.push(o.shippingLine2.trim());
  const cityBits = [
    o.shippingCity,
    o.shippingState,
    o.shippingPostalCode,
  ]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
  if (cityBits.length > 0) lines.push(cityBits.join(", "));
  const cc = (o.shippingCountry ?? "").trim().toUpperCase();
  if (cc && cc !== "IN") lines.push(cc);
  return lines.length ? lines.join("\n") : null;
}
function statusAccentText(status: OrderWorkflowStatus): string {
  switch (status) {
    case "delivered":
      return "text-green-700";
    case "shipped":
      return "text-blue-700";
    case "processing":
    case "paid":
      return "text-orange-700";
    case "pending_payment":
      return "text-neutral-600";
    case "cancelled":
      return "text-red-700";
    case "refunded":
      return "text-violet-800";
    default:
      return "text-neutral-600";
  }
}

/** Compact label for ancillary rows (delivery, payment). */
const LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-neutral-500";

const PAGE_WRAP = "min-h-screen bg-[#eaecee]";
const INNER = "mx-auto max-w-lg px-3 pb-20 pt-3 sm:max-w-xl sm:px-4 sm:pt-6";

export function OrdersHubClient() {
  const [mounted, setMounted] = useState(false);
  const [vaultRefs, setVaultRefs] = useState<VaultOrderRef[]>([]);

  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [summariesByToken, setSummariesByToken] = useState<
    Record<string, ListOrderSummary | undefined>
  >({});

  const [detailRef, setDetailRef] = useState<VaultOrderRef | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<DetailOrder | null>(null);

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupToken, setLookupToken] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);

  const [layoutPreview, setLayoutPreview] = useState(false);
  const [layoutEmptyPreview, setLayoutEmptyPreview] = useState(false);

  const hydrateVault = useCallback(() => {
    setVaultRefs(readVaultOrderRefs());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const dev = process.env.NODE_ENV === "development";
    const params = new URLSearchParams(window.location.search);
    const emptyPreview = dev && params.get("empty") === "1";
    /** Real session vault — only while developing (default is sample orders). */
    const useRealVaultInDev = dev && params.get("real_orders") === "1";
    const ordersPreview = dev && !emptyPreview && !useRealVaultInDev;

    if (!cancelled) {
      setLayoutEmptyPreview(emptyPreview);
      setLayoutPreview(ordersPreview);

      if (emptyPreview) {
        setVaultRefs([]);
        setSummariesByToken({});
        setListError(null);
      } else if (ordersPreview) {
        setVaultRefs(storefrontOrdersLayoutPreviewRefs());
        setSummariesByToken(storefrontOrdersLayoutPreviewSummariesByToken());
        setListError(null);
      } else {
        hydrateVault();
      }
      setMounted(true);
    }

    return () => {
      cancelled = true;
    };
  }, [hydrateVault]);

  const loadListFromRefs = useCallback(
    async (refs: VaultOrderRef[]) => {
      if (layoutPreview || layoutEmptyPreview) return;
      if (refs.length === 0) {
        setSummariesByToken({});
        return;
      }
      setLoadingList(true);
      setListError(null);
      try {
        const res = await fetch("/api/shop/orders/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: refs.map((r) => ({
              email: r.email,
              guestAccessToken: r.token,
            })),
          }),
        });
        const body = (await res.json()) as {
          ok?: boolean;
          orders?: ListOrderSummary[];
          error?: string;
        };
        if (!res.ok || !body.ok || !body.orders) {
          setListError(body.error ?? "Could not load your orders.");
          return;
        }
        const map: Record<string, ListOrderSummary> = {};
        for (const o of body.orders) {
          map[o.guestAccessToken] = {
            ...o,
            itemCount: o.itemCount ?? 0,
            primaryItemName: o.primaryItemName ?? null,
          };
        }
        setSummariesByToken(map);
      } catch {
        setListError("Network error loading orders.");
      } finally {
        setLoadingList(false);
      }
    },
    [layoutPreview, layoutEmptyPreview],
  );

  useEffect(() => {
    if (!mounted) return;
    void loadListFromRefs(vaultRefs);
  }, [mounted, vaultRefs, loadListFromRefs]);

  useEffect(() => {
    if (!mounted || layoutPreview || layoutEmptyPreview) return;
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      const next = readVaultOrderRefs();
      setVaultRefs(next);
      void loadListFromRefs(next);
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [mounted, layoutPreview, layoutEmptyPreview, loadListFromRefs]);

  const orderedRows = useMemo(() => {
    return vaultRefs.map((ref) => ({
      ref,
      summary: summariesByToken[ref.token],
    }));
  }, [vaultRefs, summariesByToken]);

  const matchedRows = useMemo(
    () =>
      orderedRows.filter(
        (row): row is { ref: VaultOrderRef; summary: ListOrderSummary } =>
          Boolean(row.summary),
      ),
    [orderedRows],
  );

  const openDetail = useCallback(
    async (ref: VaultOrderRef) => {
      setDetailRef(ref);
      setDetailOrder(null);
      setDetailError(null);
      setDetailLoading(true);

      if (layoutPreview) {
        const mock = storefrontOrdersLayoutPreviewDetail(ref.token);
        setDetailLoading(false);
        if (!mock) {
          setDetailError("Preview data missing for this token.");
          return;
        }
        setDetailOrder(mock);
        return;
      }

      try {
        const res = await fetch("/api/shop/orders/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: ref.email,
            guestAccessToken: ref.token,
          }),
        });
        const body = (await res.json()) as {
          ok?: boolean;
          order?: DetailOrder;
          error?: string;
        };
        if (!res.ok || !body.ok || !body.order) {
          setDetailError(body.error ?? "Could not open this order.");
          return;
        }
        setDetailOrder(body.order);
      } catch {
        setDetailError("Network error.");
      } finally {
        setDetailLoading(false);
      }
    },
    [layoutPreview],
  );

  const closeDetail = useCallback(() => {
    setDetailRef(null);
    setDetailOrder(null);
    setDetailError(null);
  }, []);

  const submitLookup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (layoutPreview) {
        setLookupMsg(
          "Showing development samples — reload with ?real_orders=1 to look up real orders.",
        );
        return;
      }
      setLookupBusy(true);
      setLookupMsg(null);
      try {
        const email = lookupEmail.trim().toLowerCase();
        const tok = lookupToken.trim();
        const probe = await fetch("/api/shop/orders/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, guestAccessToken: tok }),
        });
        const body = (await probe.json()) as { ok?: boolean; order?: { orderNumber: number }; error?: string };
        if (!probe.ok || !body.ok || !body.order?.orderNumber) {
          setLookupMsg(body.error ?? "No order matches those details.");
          return;
        }
        appendLookupToOrdersVault(email, tok, body.order.orderNumber);
        hydrateVault();
        setListError(null);
        setLookupOpen(false);
        setLookupEmail("");
        setLookupToken("");
      } finally {
        setLookupBusy(false);
      }
    },
    [lookupEmail, lookupToken, hydrateVault, layoutPreview],
  );

  if (!mounted) {
    return (
      <div className={PAGE_WRAP}>
        <div className={`${INNER} flex justify-center pt-28`}>
          <p className="text-sm tracking-wide text-neutral-400">Loading…</p>
        </div>
      </div>
    );
  }

  /* ——— Detail ————————————————————————————————————————————————— */
  if (detailRef) {
    const wf = detailOrder ? normalizeOrderStatus(detailOrder.status) : null;
    const paymentLine =
      detailOrder?.paymentProvider === "cod"
        ? "Cash on delivery"
        : detailOrder?.paymentProvider === "cashfree"
          ? "Paid online"
          : detailOrder?.paymentProvider ?? null;
    const shipFmt = detailOrder
      ? formatStoredShippingLines(detailOrder)
      : null;

    return (
      <div className={PAGE_WRAP}>
        <div className={INNER}>
          <button
            type="button"
            onClick={() => closeDetail()}
            className="mb-4 inline-flex items-center gap-2 py-2 text-[13px] font-semibold text-neutral-700"
          >
            <HiOutlineArrowLeft className="text-lg" aria-hidden />
            Orders
          </button>

          <div>
            {detailLoading ? (
              <div className="rounded-lg border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 animate-pulse" />
                <p className="text-sm text-neutral-500">Loading order…</p>
              </div>
            ) : detailError ? (
              <div
                className="rounded-lg border border-red-100 bg-white px-4 py-6 text-center text-sm text-red-800"
                role="alert"
              >
                {detailError}
              </div>
            ) : detailOrder ? (
              <>
                <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                  <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-neutral-500">
                          Order #{detailOrder.orderNumber}
                        </p>
                        <p
                          className={`mt-1 text-sm font-semibold capitalize ${wf ? statusAccentText(wf) : "text-neutral-700"}`}
                        >
                          {wf ? orderWorkflowLabel(wf) : detailOrder.statusLabel}
                        </p>
                        <p className="mt-2 text-[12px] text-neutral-500">
                          {formatDetailPlaced(detailOrder.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={LABEL}>Total</p>
                        <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-neutral-900">
                          {formatMoney(detailOrder.totalCents, detailOrder.currency)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4 sm:px-5">
                    <ul className="divide-y divide-neutral-100 rounded-md border border-neutral-100 bg-white">
                      {detailOrder.items.map((it) => (
                        <li
                          key={it.id}
                          className="flex flex-wrap items-start justify-between gap-3 px-3 py-4 sm:px-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold leading-snug text-neutral-900">
                              {it.productName}
                            </p>
                            <p className="mt-1 text-[12px] text-neutral-500">
                              {it.quantity} ×{" "}
                              {formatMoney(
                                it.unitPriceCents,
                                detailOrder.currency,
                              )}
                              {it.size ? ` · Size: ${it.size}` : ""}
                              {it.variantLabel ? ` · ${it.variantLabel}` : ""}
                            </p>
                          </div>
                          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-neutral-900">
                            {formatMoney(
                              it.lineTotalCents,
                              detailOrder.currency,
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>

                    {(detailOrder.resolvedTrackingUrl ||
                      detailOrder.trackingNumber) && (
                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
                        {detailOrder.resolvedTrackingUrl ? (
                          <a
                            href={detailOrder.resolvedTrackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center justify-center rounded border border-transparent bg-[#FF3F6C] px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-white hover:bg-[#e63660]"
                          >
                            Track order
                          </a>
                        ) : null}
                        {detailOrder.trackingNumber ? (
                          <span className="text-[11px] tabular-nums text-neutral-500">
                            AWB {detailOrder.trackingNumber}
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className="mt-4 border-t border-neutral-100 pt-4">
                      <p className={LABEL}>Payment</p>
                      <p className="mt-1 text-[13px] text-neutral-800">
                        {paymentLine ?? "—"}
                      </p>
                    </div>

                    {(detailOrder.customerName?.trim() ||
                      detailOrder.customerPhone ||
                      shipFmt) ? (
                      <div className="mt-4 border-t border-neutral-100 pt-4">
                        <p className={LABEL}>Ship to</p>
                        {shipFmt ? (
                          <p className="mt-1 whitespace-pre-line text-[13px] text-neutral-800">
                            {shipFmt}
                          </p>
                        ) : (
                          <p className="mt-1 text-[12px] text-neutral-500">
                            Street address wasn&apos;t captured for this order.
                          </p>
                        )}
                        {(detailOrder.customerName?.trim() ||
                          detailOrder.customerPhone) ? (
                          <p className="mt-2 text-[13px] text-neutral-800">
                            {[
                              detailOrder.customerName?.trim(),
                              detailOrder.customerPhone,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                            {detailOrder.customerEmail ? (
                              <span className="mt-1 block text-[12px] font-normal text-neutral-500">
                                {detailOrder.customerEmail}
                              </span>
                            ) : null}
                          </p>
                        ) : detailOrder.customerEmail ? (
                          <span className="mt-2 block text-[12px] text-neutral-500">
                            {detailOrder.customerEmail}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  /* ——— List hub ——————————————————————————————————————————— */
  const hasVault = !layoutEmptyPreview && vaultRefs.length > 0;

  return (
    <div className={PAGE_WRAP}>
      <div className={INNER}>
        <header className="mb-4 sm:mb-6">
          <h1 className="text-lg font-bold text-neutral-900 sm:text-xl">
            My orders
          </h1>
          {!layoutEmptyPreview && !layoutPreview ? (
            <p className="mt-1 text-[12px] text-neutral-500">
              Orders from checkout on this device. Lost access? Look up below.
            </p>
          ) : null}
        </header>

        {layoutEmptyPreview ? (
          <div className="mb-4 rounded border border-neutral-200 bg-white px-3 py-2.5 text-[12px] text-neutral-600">
            <span className="font-semibold text-neutral-700">Dev:</span> empty
            preview — remove{" "}
            <code className="rounded bg-neutral-100 px-1 font-mono text-[11px]">
              ?empty=1
            </code>
          </div>
        ) : null}

        {layoutPreview ? (
          <div className="mb-4 rounded border border-neutral-200 bg-white px-3 py-2.5 text-[12px] text-neutral-600">
            <span className="font-semibold text-neutral-700">Dev samples.</span>{" "}
            <code className="rounded bg-neutral-100 px-1 font-mono text-[11px]">
              ?real_orders=1
            </code>{" "}
            for vault orders,{" "}
            <code className="rounded bg-neutral-100 px-1 font-mono text-[11px]">
              ?empty=1
            </code>{" "}
            for empty.
          </div>
        ) : null}

        {loadingList && hasVault ? (
          <p className="mb-3 text-[12px] text-neutral-500">Updating…</p>
        ) : null}
        {listError ? (
          <div
            className="mb-4 rounded-lg border border-red-100 bg-white px-3 py-3 text-sm text-red-800"
            role="alert"
          >
            {listError}
          </div>
        ) : null}

        {!hasVault && !loadingList ? (
          <div className="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-[15px] font-semibold text-neutral-900">
              You have no orders yet
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px] text-neutral-500">
              Orders you place here will show automatically.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded border border-transparent bg-[#FF3F6C] px-8 text-[12px] font-bold uppercase tracking-wide text-white hover:bg-[#e63660]"
            >
              Shop now
            </Link>
          </div>
        ) : null}

        {hasVault &&
        !loadingList &&
        matchedRows.length === 0 &&
        !listError &&
        !layoutPreview &&
        !layoutEmptyPreview ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-white px-4 py-3 text-[13px] text-amber-950">
            <p className="font-semibold">Could not load saved orders.</p>
            <p className="mt-1 text-[12px] opacity-90">
              Try look up below with email and code from confirmation.
            </p>
          </div>
        ) : null}

        {hasVault && matchedRows.length > 0 ? (
          <div>
            <ul className="space-y-2">
              {matchedRows.map(({ ref, summary }) => {
                const wf = normalizeOrderStatus(summary.status);
                return (
                  <li key={ref.token}>
                    <button
                      type="button"
                      onClick={() => void openDetail(ref)}
                      className="flex w-full items-start gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3.5 text-left shadow-sm hover:border-neutral-300"
                    >
                      <div className="min-h-[52px] w-12 shrink-0 rounded-md border border-neutral-100 bg-neutral-50" />

                      <div className="min-w-0 flex-1">
                        <p className={`text-[12px] font-semibold ${statusAccentText(wf)}`}>
                          {orderWorkflowLabel(wf)}
                        </p>
                        <p className="mt-1 text-[12px] text-neutral-900">
                          <span className="font-semibold tabular-nums">
                            #{summary.orderNumber}
                          </span>
                          <span className="mx-2 text-neutral-300">·</span>
                          <span className="text-neutral-500">
                            {formatOrderDateShort(summary.createdAt)}
                          </span>
                        </p>
                        <p className="mt-1 truncate text-[12px] text-neutral-600">
                          {listPreviewSubtitle(summary)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                        <span className="text-[13px] font-semibold tabular-nums text-neutral-900">
                          {formatMoney(summary.totalCents, summary.currency)}
                        </span>
                        <HiOutlineChevronRight
                          className="text-lg text-neutral-400"
                          aria-hidden
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {vaultRefs.some((r) => !summariesByToken[r.token]) ? (
              <p className={`${sf.sub} mt-3 px-1 text-[11px] text-neutral-500`}>
                Some saved entries couldn’t load.
              </p>
            ) : null}
          </div>
        ) : null}

        {!layoutPreview ? (
          <div
            className={`mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white p-5 shadow-sm`}
          >
            <button
              type="button"
              onClick={() => setLookupOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="inline-flex items-center gap-3">
                <HiOutlineSearch className="text-xl text-neutral-500" aria-hidden />
                <span className="text-[14px] font-semibold text-neutral-900">
                  {lookupOpen ? "Hide" : "Find order"}
                </span>
              </span>
              <HiOutlineChevronRight
                className={`text-xl text-neutral-400 transition shrink-0 ${lookupOpen ? "rotate-90" : ""}`}
              />
            </button>
            {lookupOpen ? (
              <div className="mt-5 border-t border-neutral-100 pt-5">
                <p className={`${sf.sub} mb-5 text-[13px] text-neutral-600`}>
                  Email and access code from your confirmation.
                </p>
                <form
                  className="grid max-w-md gap-4"
                  onSubmit={(e) => void submitLookup(e)}
                >
                  <label className="block">
                    <span className={LABEL}>Email</span>
                    <input
                      type="email"
                      required
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      className={`${sf.input} mt-1 rounded-md`}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>Access code</span>
                    <input
                      type="text"
                      required
                      value={lookupToken}
                      onChange={(e) => setLookupToken(e.target.value)}
                      spellCheck={false}
                      className={`${sf.input} mt-1 rounded-md font-mono text-[13px]`}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={lookupBusy}
                    className="inline-flex min-h-10 items-center justify-center rounded border border-transparent bg-neutral-900 px-6 text-[12px] font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {lookupBusy ? "Checking…" : "Save"}
                  </button>
                  {lookupMsg ? (
                    <p className="text-sm text-red-700" role="alert">
                      {lookupMsg}
                    </p>
                  ) : null}
                </form>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
