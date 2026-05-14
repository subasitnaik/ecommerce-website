"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminOrderRow } from "@/lib/admin-orders";
import type { CourierPreset } from "@/lib/courier-presets";
import type {
  OrderQueueFilter,
  OrderWorkflowStatus,
} from "@/lib/order-workflow";
import {
  orderMatchesQueueFilter,
  normalizeOrderStatus,
} from "@/lib/order-workflow";
import {
  adminFilterInputClass,
  adminSortSelectClass,
} from "@/admin-dashboard/admin-filters";
import CourierPresetsManager from "@/admin-dashboard/components/CourierPresetsManager";
import { OrderTable, Pagination, RowsPerPage, Sidebar } from "../components";
import { HiOutlineChevronRight } from "react-icons/hi";
import { HiOutlineSearch } from "react-icons/hi";
const QUEUE_TABS: { id: OrderQueueFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new_orders", label: "New orders" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refunded", label: "Refunded" },
];

type Props = {
  initialOrders: AdminOrderRow[];
  initialCourierPresets: CourierPreset[];
  /** From `?queue=` on `/admin/orders`; when omitted the default is New orders. */
  initialQueue: OrderQueueFilter | null;
};

export default function OrdersClient({
  initialOrders,
  initialCourierPresets,
  initialQueue,
}: Props) {
  const [items, setItems] = useState(initialOrders);
  const [courierPresets, setCourierPresets] = useState(initialCourierPresets);
  const [queue, setQueue] = useState<OrderQueueFilter>(
    () => initialQueue ?? "new_orders",
  );
  const [q, setQ] = useState("");

  useEffect(() => {
    setCourierPresets(initialCourierPresets);
  }, [initialCourierPresets]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((o) => {
      if (!orderMatchesQueueFilter(o.normalizedStatus, queue)) return false;
      if (!query) return true;
      const blob = [
        o.displayId,
        o.id,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        ...o.lineItems.flatMap((l) => [
          l.productName,
          l.size ?? "",
          l.variantLabel ?? "",
          l.variantId ?? "",
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [items, queue, q]);

  async function handleStatusChange(
    id: string,
    status: OrderWorkflowStatus,
  ): Promise<void> {
    if (id.startsWith("demo-order")) {
      setItems((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                normalizedStatus: status,
                adminSeenAt: new Date().toISOString(),
              }
            : o,
        ),
      );
      return;
    }

    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "Could not update order.");
      return;
    }
    const data = (await res.json()) as { status: string };
    setItems((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: data.status,
              normalizedStatus: normalizeOrderStatus(data.status),
              adminSeenAt: new Date().toISOString(),
            }
          : o,
      ),
    );
  }

  async function handleTrackingSave(
    id: string,
    trackingNumber: string | null,
    courierPresetId: string | null,
    options?: { markShipped?: boolean },
  ): Promise<boolean> {
    if (id.startsWith("demo-order")) {
      setItems((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                trackingNumber,
                courierPresetId,
                ...(options?.markShipped
                  ? {
                      status: "shipped",
                      normalizedStatus: normalizeOrderStatus("shipped"),
                    }
                  : {}),
                adminSeenAt: new Date().toISOString(),
              }
            : o,
        ),
      );
      return true;
    }

    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingNumber,
        courierPresetId,
        ...(options?.markShipped ? { status: "shipped" as const } : {}),
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "Could not save tracking.");
      return false;
    }
    const data = (await res.json()) as {
      status?: string;
      trackingNumber: string | null;
      courierPresetId: string | null;
    };
    setItems((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              trackingNumber: data.trackingNumber,
              courierPresetId: data.courierPresetId,
              ...(data.status
                ? {
                    status: data.status,
                    normalizedStatus: normalizeOrderStatus(data.status),
                  }
                : {}),
              adminSeenAt: new Date().toISOString(),
            }
          : o,
      ),
    );
    return true;
  }

  return (
    <div className="flex h-auto min-w-0 border-t border-blackSecondary bg-whiteSecondary dark:bg-blackPrimary">
      <Sidebar />
      <div className="w-full min-w-0 dark:bg-blackPrimary bg-whiteSecondary">
        <div className="py-6 sm:py-10 dark:bg-blackPrimary bg-whiteSecondary">
          <div className="flex w-full min-w-0 flex-col items-stretch gap-4 px-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:px-8">
            <div className="min-w-0 flex flex-col gap-2 sm:gap-3">
              <h2 className="text-2xl font-bold leading-7 text-blackPrimary dark:text-whiteSecondary sm:text-3xl">
                Manage orders
              </h2>
              <p className="flex flex-wrap items-center gap-1 text-base font-normal text-blackPrimary dark:text-whiteSecondary">
                <span>Dashboard</span>
                <HiOutlineChevronRight className="shrink-0 text-lg" />
                <span>Orders</span>
              </p>
              <p className="max-w-xl text-xs text-blackPrimary/70 dark:text-whiteSecondary/65">
                <strong className="font-semibold text-blackPrimary dark:text-whiteSecondary">
                  New orders
                </strong>{" "}
                are <span className="font-medium">Awaiting payment</span> or{" "}
                <span className="font-medium">Paid</span>. Move to{" "}
                <span className="font-medium">Processing</span> when you start
                packing. To ship: set status to Shipped → enter AWB and courier →
                save (that marks it Shipped).
              </p>
            </div>
          </div>

          <div className="mt-6">
            <CourierPresetsManager
              initialPresets={courierPresets}
              onSaved={setCourierPresets}
            />
          </div>

          <div className="mt-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:px-6 lg:mx-8 lg:max-w-5xl lg:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUEUE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQueue(t.id)}
                className={`snap-start whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  queue === t.id
                    ? "border-blackPrimary bg-blackPrimary text-whiteSecondary dark:border-whiteSecondary dark:bg-whiteSecondary dark:text-blackPrimary"
                    : "border-gray-600 bg-transparent text-blackPrimary hover:border-gray-500 dark:border-gray-500 dark:text-whiteSecondary dark:hover:border-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex w-full min-w-0 flex-col gap-3 px-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:px-8">
            <div className="relative w-full min-w-0 sm:max-w-sm sm:flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <input
                type="text"
                className={adminFilterInputClass}
                placeholder="Search order #, customer, email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="w-full min-w-0 sm:w-auto sm:max-w-sm">
              <select
                className={adminSortSelectClass}
                name="sort"
                id="sort"
                defaultValue="newest"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          <OrderTable
            items={filtered}
            courierPresets={courierPresets}
            onStatusChange={handleStatusChange}
            onTrackingSave={handleTrackingSave}
          />
          <div className="flex flex-col items-stretch justify-between gap-4 px-4 py-6 max-sm:pb-0 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <RowsPerPage />
            <Pagination />
          </div>
        </div>
      </div>
    </div>
  );
}
