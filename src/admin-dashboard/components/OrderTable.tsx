"use client";

import type { AdminOrderLine, AdminOrderRow } from "@/lib/admin-orders";
import type { CourierPreset } from "@/lib/courier-presets";
import {
  adminOrderStatusDropdownOptions,
} from "@/lib/admin-order-status-transitions";
import { formatMoney } from "@/lib/format";
import {
  badgeClassForWorkflow,
  orderWorkflowLabel,
  type OrderWorkflowStatus,
} from "@/lib/order-workflow";
import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";
import { HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineEye } from "react-icons/hi";
import { useEffect, useState } from "react";

type Props = {
  items: AdminOrderRow[];
  /** Named couriers from shop settings — URL built from template + AWB on the storefront. */
  courierPresets: CourierPreset[];
  onStatusChange?: (id: string, status: OrderWorkflowStatus) => Promise<void>;
  onTrackingSave?: (
    id: string,
    trackingNumber: string | null,
    courierPresetId: string | null,
    options?: { markShipped?: boolean },
  ) => Promise<boolean>;
};

function ShipmentTrackingForm({
  orderId,
  trackingNumber,
  courierPresetId,
  courierPresets,
  pending,
  markShipped,
  onSave,
}: {
  orderId: string;
  trackingNumber: string | null;
  courierPresetId: string | null;
  courierPresets: CourierPreset[];
  pending: boolean;
  /** When true, PATCH also sets status → shipped (processing → shipped flow). */
  markShipped?: boolean;
  onSave: (
    id: string,
    tn: string | null,
    presetId: string | null,
    options?: { markShipped?: boolean },
  ) => Promise<boolean>;
}) {
  const [tn, setTn] = useState(trackingNumber ?? "");
  const [preset, setPreset] = useState(courierPresetId ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTn(trackingNumber ?? "");
    setPreset(courierPresetId ?? "");
  }, [orderId, trackingNumber, courierPresetId]);

  async function save() {
    setSaving(true);
    try {
      const pid = preset.trim() || null;
      await onSave(orderId, tn.trim() || null, pid, {
        markShipped: Boolean(markShipped),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-600/35 bg-blackPrimary/[0.02] p-3 dark:border-gray-500/25 dark:bg-white/[0.03]">
      <label className="block text-[11px] font-semibold text-neutral-500">
        AWB / tracking no.
        <input
          type="text"
          value={tn}
          onChange={(e) => setTn(e.target.value)}
          maxLength={160}
          className="mt-1 w-full rounded-lg border border-gray-600 bg-white px-2 py-2 text-sm outline-none dark:border-gray-500 dark:bg-blackPrimary dark:text-whiteSecondary"
          placeholder="Tracking number"
        />
      </label>
      <label className="mt-2 block text-[11px] font-semibold text-neutral-500">
        Courier
        <select
          className="mt-1 w-full rounded-lg border border-gray-600 bg-white px-2 py-2 text-sm outline-none dark:border-gray-500 dark:bg-blackPrimary dark:text-whiteSecondary"
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
        >
          <option value="">Select template</option>
          {courierPresets.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {courierPresets.length === 0 ? (
        <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-300/90">
          Add a courier preset at the top of this page first.
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending || saving}
        onClick={() => void save()}
        className="mt-3 w-full rounded-lg border border-gray-600 py-2 text-xs font-semibold text-blackPrimary transition hover:bg-blackPrimary/[0.06] disabled:opacity-50 dark:border-gray-500 dark:text-whiteSecondary dark:hover:bg-white/[0.06]"
      >
        {saving ? "Saving…" : markShipped ? "Save tracking & mark shipped" : "Save tracking"}
      </button>
    </div>
  );
}

function CustomerBlock({ o }: { o: AdminOrderRow }) {
  const name = o.customerName?.trim() || "Guest";
  const email = o.customerEmail?.trim();
  const phone = o.customerPhone?.trim();
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-blackPrimary dark:text-whiteSecondary sm:text-base">
        {name}
      </p>
      {email ? (
        <p className="truncate text-xs text-blackPrimary/70 dark:text-whiteSecondary/70">
          {email}
        </p>
      ) : null}
      {phone ? (
        <p className="text-xs text-blackPrimary/60 dark:text-whiteSecondary/60">
          {phone}
        </p>
      ) : null}
    </div>
  );
}

function PaymentTag({ provider }: { provider: string | null }) {
  if (!provider) {
    return (
      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
        —
      </span>
    );
  }
  const p = provider.toLowerCase();
  const label =
    p === "cod" ? "COD" : p === "cashfree" ? "Paid online" : provider;
  return (
    <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
      {label}
    </span>
  );
}

function OrderLineItemsBlock({
  orderId,
  currency,
  itemCount,
  lines,
  expanded,
  onToggle,
}: {
  orderId: string;
  currency: string;
  itemCount: number;
  lines: AdminOrderLine[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `order-line-items-${orderId}`;

  if (lines.length === 0) {
    return (
      <p className="text-sm text-blackPrimary/70 dark:text-whiteSecondary/65">
        No line items
      </p>
    );
  }

  const label =
    itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-blackPrimary/90 dark:text-whiteSecondary/90">
          {label}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-gray-600/70 bg-transparent px-2 py-1 text-xs font-semibold text-blackPrimary outline-none ring-offset-white transition hover:bg-blackPrimary/5 focus-visible:ring-2 focus-visible:ring-blackPrimary/40 dark:border-gray-500 dark:text-whiteSecondary dark:ring-offset-blackPrimary dark:hover:bg-white/5 dark:focus-visible:ring-white/35"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {expanded ? (
            <>
              Hide items
              <HiOutlineChevronUp className="text-base" aria-hidden />
            </>
          ) : (
            <>
              Show items
              <HiOutlineChevronDown className="text-base" aria-hidden />
            </>
          )}
        </button>
      </div>
      {expanded ? (
        <ul
          id={panelId}
          className="divide-y divide-gray-600/25 rounded-lg border border-gray-600/35 bg-blackPrimary/[0.02] dark:divide-gray-500/25 dark:bg-white/[0.03]"
        >
          {lines.map((line) => {
            const lineTotal = line.priceCents * line.quantity;
            const details: string[] = [];
            details.push(`${line.quantity} × ${formatMoney(line.priceCents, currency)}`);
            if (line.size) details.push(`Size ${line.size}`);
            if (line.variantLabel)
              details.push(`Variant · ${line.variantLabel}`);
            else if (line.variantId)
              details.push(`Variant id · ${line.variantId}`);
            return (
              <li
                key={line.id}
                className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-blackPrimary dark:text-whiteSecondary">
                    {line.productName}
                  </p>
                  <p className="mt-1 text-xs text-blackPrimary/70 dark:text-whiteSecondary/65">
                    {details.join(" · ")}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-blackPrimary dark:text-whiteSecondary sm:pt-0.5">
                  {formatMoney(lineTotal, currency)}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function OrderTable({
  items,
  courierPresets,
  onStatusChange,
  onTrackingSave,
}: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  /** Processing → user picked “Shipped” in dropdown: collect AWB, then PATCH shipped on save */
  const [shipDraftIds, setShipDraftIds] = useState<Set<string>>(() => new Set());
  /** Shipped: inline edit tracking */
  const [shippedEditingIds, setShippedEditingIds] = useState<Set<string>>(
    () => new Set(),
  );

  function toggleLines(orderId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  useEffect(() => {
    setShipDraftIds((prev) => {
      const next = new Set(prev);
      for (const o of items) {
        if (o.normalizedStatus !== "processing") next.delete(o.id);
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    setShippedEditingIds((prev) => {
      const next = new Set(prev);
      for (const o of items) {
        if (o.normalizedStatus !== "shipped") next.delete(o.id);
      }
      return next;
    });
  }, [items]);

  function courierName(presetId: string | null): string | null {
    if (!presetId) return null;
    return courierPresets.find((c) => c.id === presetId)?.name ?? presetId;
  }

  async function handleSelect(orderId: string, value: string) {
    const status = value as OrderWorkflowStatus;
    const order = items.find((o) => o.id === orderId);
    if (!order || !onStatusChange) return;

    const norm = order.normalizedStatus;

    if (norm === "processing") {
      if (status === "shipped") {
        setShipDraftIds((prev) => new Set(prev).add(orderId));
        return;
      }
      if (status === "processing") {
        setShipDraftIds((prev) => {
          const n = new Set(prev);
          n.delete(orderId);
          return n;
        });
        return;
      }
    }

    if (norm === status) return;

    setPendingId(orderId);
    try {
      await onStatusChange(orderId, status);
    } finally {
      setPendingId(null);
    }
  }

  function selectDisplayedValue(o: AdminOrderRow): OrderWorkflowStatus {
    if (
      o.normalizedStatus === "processing" &&
      shipDraftIds.has(o.id)
    ) {
      return "shipped";
    }
    return o.normalizedStatus;
  }

  async function handleTrackingSaveWrapped(
    id: string,
    tn: string | null,
    presetId: string | null,
    options?: { markShipped?: boolean },
  ): Promise<boolean> {
    if (!onTrackingSave) return false;
    const ok = await onTrackingSave(id, tn, presetId, options);
    if (ok) {
      setShipDraftIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      setShippedEditingIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
    return ok;
  }

  if (items.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-lg border border-dashed border-gray-500/60 px-4 py-10 text-center text-sm text-blackPrimary/70 dark:text-whiteSecondary/70 sm:mx-6 lg:mx-8">
        No orders match this filter.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-3 px-4 sm:px-6 lg:px-8">
      {items.map((o) => {
        const formattedDate = new Date(o.createdAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        const unseen = o.adminSeenAt == null;

        return (
          <li key={o.id}>
            <div className="overflow-hidden rounded-lg border border-gray-600/60 bg-whiteSecondary/90 shadow-sm dark:bg-blackPrimary/50">
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className="font-mono text-xs text-blackPrimary/85 dark:text-whiteSecondary/85"
                        title={`Order id (internal): ${o.id}`}
                      >
                        Order{" "}
                        <span className="tabular-nums text-blackPrimary dark:text-whiteSecondary">
                          {o.displayId}
                        </span>
                      </span>
                      {unseen ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                          title="Not opened yet"
                          aria-label="Unseen"
                        />
                      ) : null}
                      <PaymentTag provider={o.paymentProvider} />
                    </div>
                    <CustomerBlock o={o} />
                    <p className="text-xs text-blackPrimary/65 dark:text-whiteSecondary/65">
                      {formattedDate}
                    </p>
                    <OrderLineItemsBlock
                      orderId={o.id}
                      currency={o.currency}
                      itemCount={o.itemCount}
                      lines={o.lineItems}
                      expanded={expandedIds.has(o.id)}
                      onToggle={() => toggleLines(o.id)}
                    />
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 border-t border-gray-600/25 pt-3 sm:w-72 sm:flex-shrink-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 dark:sm:border-gray-500/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
                      <span
                        className={`inline-flex rounded px-2 py-1 text-[11px] font-semibold ${badgeClassForWorkflow(o.normalizedStatus)}`}
                      >
                        {orderWorkflowLabel(o.normalizedStatus)}
                      </span>
                      <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-200">
                        {formatMoney(o.totalCents, o.currency)}
                      </p>
                    </div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      Order status
                      <select
                        className="mt-1 w-full rounded-lg border border-gray-600 bg-white px-2 py-2 text-sm text-blackPrimary outline-none dark:border-gray-500 dark:bg-blackPrimary dark:text-whiteSecondary disabled:opacity-50"
                        value={selectDisplayedValue(o)}
                        disabled={
                          pendingId === o.id ||
                          !onStatusChange ||
                          adminOrderStatusDropdownOptions(o.normalizedStatus)
                            .length <= 1
                        }
                        onChange={(e) =>
                          void handleSelect(o.id, e.target.value)
                        }
                      >
                        {adminOrderStatusDropdownOptions(o.normalizedStatus).map(
                          (v) => (
                            <option key={v} value={v}>
                              {orderWorkflowLabel(v)}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    {onTrackingSave &&
                      o.normalizedStatus === "processing" &&
                      shipDraftIds.has(o.id) ? (
                      <ShipmentTrackingForm
                        orderId={o.id}
                        trackingNumber={o.trackingNumber}
                        courierPresetId={o.courierPresetId}
                        courierPresets={courierPresets}
                        pending={pendingId === o.id}
                        markShipped
                        onSave={handleTrackingSaveWrapped}
                      />
                    ) : null}

                    {onTrackingSave &&
                    o.normalizedStatus === "shipped" &&
                      !shippedEditingIds.has(o.id) ? (
                      <div className="flex flex-wrap items-end justify-between gap-2 rounded-lg border border-gray-600/30 bg-blackPrimary/[0.02] px-3 py-2 dark:border-gray-500/25 dark:bg-white/[0.03]">
                        <div className="min-w-0 text-[12px] leading-snug text-blackPrimary/85 dark:text-whiteSecondary/85">
                          {o.trackingNumber ? (
                            <p className="font-mono tabular-nums">
                              AWB · {o.trackingNumber}
                            </p>
                          ) : (
                            <p>No AWB recorded</p>
                          )}
                          {courierName(o.courierPresetId) ? (
                            <p className="mt-0.5 text-[11px] text-blackPrimary/60 dark:text-whiteSecondary/65">
                              {courierName(o.courierPresetId)}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={pendingId === o.id}
                          onClick={() =>
                            setShippedEditingIds((prev) =>
                              new Set(prev).add(o.id),
                            )
                          }
                          className="shrink-0 text-xs font-semibold text-blackPrimary underline underline-offset-2 hover:opacity-80 disabled:opacity-50 dark:text-whiteSecondary"
                        >
                          Edit tracking
                        </button>
                      </div>
                    ) : null}

                    {onTrackingSave &&
                    o.normalizedStatus === "shipped" &&
                      shippedEditingIds.has(o.id) ? (
                      <ShipmentTrackingForm
                        orderId={o.id}
                        trackingNumber={o.trackingNumber}
                        courierPresetId={o.courierPresetId}
                        courierPresets={courierPresets}
                        pending={pendingId === o.id}
                        onSave={handleTrackingSaveWrapped}
                      />
                    ) : null}
                    <div className="flex justify-end">
                      <Link
                        to={`/orders/${encodeURIComponent(o.id)}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blackPrimary underline dark:text-whiteSecondary"
                      >
                        <HiOutlineEye className="text-lg" />
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
