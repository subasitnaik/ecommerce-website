"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { AdminOrderLine, AdminOrderRow } from "@/lib/admin-orders";
import {
  badgeClassForWorkflow,
  orderWorkflowLabel,
} from "@/lib/order-workflow";
import { formatMoney } from "@/lib/format";
import { Sidebar } from "../components";
import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";
import {
  HiOutlineArrowLeft,
  HiOutlineCash,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineTruck,
} from "react-icons/hi";

function useOrderIdFromPath(): string | null {
  const path = usePathname();
  return useMemo(() => {
    const parts = (path || "").split("/").filter(Boolean);
    const i = parts.indexOf("orders");
    if (i < 0) return null;
    const seg = parts[i + 1];
    if (!seg || seg === "create-order") return null;
    return decodeURIComponent(seg);
  }, [path]);
}

function paymentLabel(provider: string | null): string {
  if (!provider) return "—";
  const p = provider.toLowerCase();
  if (p === "cod") return "Cash on delivery";
  if (p === "cashfree") return "Paid online (Cashfree)";
  return provider;
}

function adminFormatShippingLines(o: AdminOrderRow): string | null {
  const lines: string[] = [];
  if (o.shippingLine1?.trim()) lines.push(o.shippingLine1.trim());
  if (o.shippingLine2?.trim()) lines.push(o.shippingLine2.trim());
  const cityBits = [o.shippingCity, o.shippingState, o.shippingPostalCode]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
  if (cityBits.length > 0) lines.push(cityBits.join(", "));
  const cc = (o.shippingCountry ?? "").trim().toUpperCase();
  if (cc && cc !== "IN") lines.push(cc);
  return lines.length ? lines.join("\n") : null;
}

function lineSubtitle(line: AdminOrderLine): string {
  const parts: string[] = [];
  if (line.size) parts.push(`Size ${line.size}`);
  if (line.variantLabel) parts.push(line.variantLabel);
  return parts.join(" · ");
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blackPrimary/40 dark:text-whiteSecondary/45" aria-hidden />
      ) : null}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blackPrimary/50 dark:text-whiteSecondary/55">
          {label}
        </p>
        <div className="mt-1 text-sm text-blackPrimary dark:text-whiteSecondary">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function EditOrder() {
  const orderId = useOrderIdFromPath();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<AdminOrderRow | null>(null);
  const [courierPresetName, setCourierPresetName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Missing order in URL.");
      return;
    }

    let cancelled = false;
    async function load() {
      if (!orderId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}`,
          { credentials: "include" },
        );
        const body = (await res.json()) as {
          ok?: boolean;
          order?: AdminOrderRow;
          courierPresetName?: string | null;
          error?: string;
        };
        if (!res.ok || !body.ok || !body.order) {
          if (!cancelled) setError(body.error ?? "Could not load this order.");
          return;
        }
        if (!cancelled) {
          setOrder(body.order);
          setCourierPresetName(body.courierPresetName ?? null);
        }
      } catch {
        if (!cancelled) setError("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const placedDisplay = order
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "";

  const shippingDisplay = order ? adminFormatShippingLines(order) : null;

  const hasShipmentMeta =
    order &&
    Boolean(
      order.trackingNumber ||
        order.courierPresetId ||
        courierPresetName,
    );

  return (
    <div className="flex h-auto min-w-0 border-t border-blackSecondary bg-whiteSecondary dark:bg-blackPrimary">
      <Sidebar />
      <div className="w-full min-w-0 pb-14">
        <div className="border-b border-gray-600/30 bg-blackPrimary/[0.02] px-4 py-4 dark:border-gray-500/35 dark:bg-white/[0.02] sm:px-6 lg:px-8">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blackPrimary/85 transition hover:text-blackPrimary dark:text-whiteSecondary/85 dark:hover:text-whiteSecondary"
          >
            <HiOutlineArrowLeft className="text-lg" aria-hidden />
            Back to orders
          </Link>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {loading ? (
            <div className="rounded-2xl border border-gray-600/35 bg-whiteSecondary px-8 py-20 text-center text-sm text-blackPrimary/60 dark:border-gray-500/30 dark:bg-blackPrimary dark:text-whiteSecondary/60">
              Loading order…
            </div>
          ) : error || !order ? (
            <div
              className="rounded-2xl border border-rose-200/70 bg-rose-50 px-6 py-8 text-center text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
              role="alert"
            >
              {error ?? "Order not found."}
            </div>
          ) : (
            <article className="overflow-hidden rounded-2xl border border-gray-600/35 bg-whiteSecondary shadow-sm dark:border-gray-500/30 dark:bg-blackPrimary dark:shadow-none">
              <header className="border-b border-gray-600/25 bg-gradient-to-br from-blackPrimary/[0.04] via-transparent to-transparent px-5 py-6 sm:px-8 sm:py-8 dark:border-gray-500/25 dark:from-white/[0.06]">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blackPrimary/55 dark:text-whiteSecondary/55">
                      Order #{order.displayId}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-blackPrimary dark:text-whiteSecondary sm:text-3xl">
                      {order.customerName?.trim() || "Guest"}
                    </h1>
                    <p className="mt-2 text-sm text-blackPrimary/65 dark:text-whiteSecondary/65">
                      {placedDisplay}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${badgeClassForWorkflow(order.normalizedStatus)}`}
                      >
                        {orderWorkflowLabel(order.normalizedStatus)}
                      </span>
                      <span className="inline-flex rounded-md border border-gray-600/50 bg-transparent px-2.5 py-1 text-[11px] font-medium text-blackPrimary/85 dark:border-gray-500/50 dark:text-whiteSecondary/85">
                        {paymentLabel(order.paymentProvider)}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blackPrimary/45 dark:text-whiteSecondary/45">
                      Order total
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-rose-600 dark:text-rose-300">
                      {formatMoney(order.totalCents, order.currency)}
                    </p>
                    <p className="mt-1 text-xs text-blackPrimary/55 dark:text-whiteSecondary/55">
                      {order.itemCount}{" "}
                      {order.itemCount === 1 ? "piece" : "pieces"} ·{" "}
                      {order.lineItems.length}{" "}
                      {order.lineItems.length === 1 ? "line" : "lines"}
                    </p>
                  </div>
                </div>
              </header>

              <div className="grid lg:grid-cols-12">
                <section className="space-y-6 border-b border-gray-600/20 px-5 py-6 sm:px-8 lg:col-span-5 lg:border-b-0 lg:border-r dark:border-gray-500/25">
                  <div className="space-y-5">
                    <Fact icon={HiOutlineMail} label="Email">
                      {order.customerEmail?.trim() ?? (
                        <span className="text-blackPrimary/50 dark:text-whiteSecondary/45">
                          Not provided
                        </span>
                      )}
                    </Fact>
                    <Fact icon={HiOutlinePhone} label="Phone">
                      {order.customerPhone?.trim() ?? (
                        <span className="text-blackPrimary/50 dark:text-whiteSecondary/45">
                          Not provided
                        </span>
                      )}
                    </Fact>
                    <Fact icon={HiOutlineCash} label="Payment">
                      {paymentLabel(order.paymentProvider)}
                    </Fact>
                    <Fact icon={HiOutlineLocationMarker} label="Delivery address">
                      {shippingDisplay ? (
                        <span className="whitespace-pre-line leading-relaxed">
                          {shippingDisplay}
                        </span>
                      ) : (
                        <span className="text-blackPrimary/52 dark:text-whiteSecondary/52">
                          Not on file — this order predates checkout address
                          capture, or no shipping details were recorded.
                        </span>
                      )}
                    </Fact>
                  </div>

                  {hasShipmentMeta ? (
                    <div className="border-t border-gray-600/25 pt-6 dark:border-gray-500/30">
                      <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-blackPrimary/55 dark:text-whiteSecondary/55">
                        <HiOutlineTruck className="text-base" aria-hidden />
                        Fulfillment / tracking
                      </p>
                      <div className="space-y-3 text-sm">
                        {order.trackingNumber ? (
                          <p className="font-mono text-[13px] tabular-nums text-blackPrimary dark:text-whiteSecondary">
                            {order.trackingNumber}
                          </p>
                        ) : (
                          <p className="text-blackPrimary/55 dark:text-whiteSecondary/55">
                            No AWB yet
                          </p>
                        )}
                        {(courierPresetName ?? order.courierPresetId) ? (
                          <p className="text-blackPrimary/80 dark:text-whiteSecondary/85">
                            {courierPresetName ?? order.courierPresetId}
                          </p>
                        ) : (
                          <p className="text-blackPrimary/50 dark:text-whiteSecondary/45">
                            No courier template linked
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <p className="border-t border-dashed border-gray-600/30 pt-4 text-[11px] text-blackPrimary/45 dark:border-gray-500/35 dark:text-whiteSecondary/45">
                    Internal reference:{" "}
                    <span className="font-mono text-blackPrimary/70 dark:text-whiteSecondary/65">
                      {order.id}
                    </span>
                  </p>
                </section>

                <section className="lg:col-span-7">
                  <div className="border-b border-gray-600/25 bg-blackPrimary/[0.015] px-5 py-3 sm:px-8 dark:border-gray-500/25 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <HiOutlineLocationMarker
                        className="text-blackPrimary/50 dark:text-whiteSecondary/55"
                        aria-hidden
                      />
                      <h2 className="text-[11px] font-bold uppercase tracking-wide text-blackPrimary/60 dark:text-whiteSecondary/60">
                        Items
                      </h2>
                    </div>
                  </div>

                  {/* Desktop/tablet: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-600/25 text-[10px] font-semibold uppercase tracking-wide text-blackPrimary/55 dark:border-gray-500/30 dark:text-whiteSecondary/55">
                          <th className="py-3 pl-8 pr-3 font-semibold">
                            Product
                          </th>
                          <th className="py-3 px-3 font-semibold">Qty</th>
                          <th className="py-3 px-3 font-semibold text-right tabular-nums">
                            Rate
                          </th>
                          <th className="py-3 pl-3 pr-8 font-semibold text-right tabular-nums">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600/15 dark:divide-gray-500/20">
                        {order.lineItems.map((line) => {
                          const sub = lineSubtitle(line);
                          const lt = line.priceCents * line.quantity;
                          return (
                            <tr
                              key={line.id}
                              className="text-blackPrimary dark:text-whiteSecondary"
                            >
                              <td className="max-w-[16rem] py-4 pl-8 pr-3 align-top">
                                <span className="font-semibold leading-snug">
                                  {line.productName}
                                </span>
                                {sub ? (
                                  <p className="mt-1 text-xs text-blackPrimary/58 dark:text-whiteSecondary/55">
                                    {sub}
                                  </p>
                                ) : null}
                              </td>
                              <td className="py-4 px-3 align-top tabular-nums text-blackPrimary/90 dark:text-whiteSecondary/90">
                                {line.quantity}
                              </td>
                              <td className="py-4 px-3 align-top text-right tabular-nums text-blackPrimary/80 dark:text-whiteSecondary/78">
                                {formatMoney(line.priceCents, order.currency)}
                              </td>
                              <td className="py-4 pl-3 pr-8 align-top text-right font-semibold tabular-nums">
                                {formatMoney(lt, order.currency)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: stacked */}
                  <ul className="divide-y divide-gray-600/18 md:hidden dark:divide-gray-500/22">
                    {order.lineItems.map((line) => {
                      const sub = lineSubtitle(line);
                      const lt = line.priceCents * line.quantity;
                      return (
                        <li
                          key={line.id}
                          className="px-5 py-4 sm:px-8 dark:text-whiteSecondary"
                        >
                          <div className="flex justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold leading-snug text-blackPrimary dark:text-whiteSecondary">
                                {line.productName}
                              </p>
                              {sub ? (
                                <p className="mt-1 text-xs text-blackPrimary/58 dark:text-whiteSecondary/52">
                                  {sub}
                                </p>
                              ) : null}
                              <p className="mt-2 text-xs text-blackPrimary/60 dark:text-whiteSecondary/55">
                                Qty <span className="tabular-nums">{line.quantity}</span> ×{" "}
                                {formatMoney(line.priceCents, order.currency)}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold tabular-nums text-blackPrimary dark:text-whiteSecondary">
                              {formatMoney(lt, order.currency)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <footer className="flex items-center justify-between gap-4 border-t border-gray-600/22 bg-blackPrimary/[0.02] px-5 py-4 sm:px-8 dark:border-gray-500/28 dark:bg-white/[0.03]">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blackPrimary/55 dark:text-whiteSecondary/55">
                      Total
                    </span>
                    <span className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-300">
                      {formatMoney(order.totalCents, order.currency)}
                    </span>
                  </footer>
                </section>
              </div>

              <p className="border-t border-gray-600/22 bg-blackPrimary/[0.015] px-5 py-3 text-[11px] text-blackPrimary/50 dark:border-gray-500/25 dark:bg-white/[0.015] dark:text-whiteSecondary/50 sm:px-8">
                Update status or tracking from{" "}
                <Link to="/orders" className="font-semibold underline underline-offset-2">
                  Manage orders
                </Link>
                .
              </p>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
