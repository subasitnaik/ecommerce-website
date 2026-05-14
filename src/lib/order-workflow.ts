/**
 * Fulfillment-style workflow (similar to Seller Central / Shopify admin).
 * Stored in Order.status as a string.
 */

export const ORDER_WORKFLOW_VALUES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderWorkflowStatus = (typeof ORDER_WORKFLOW_VALUES)[number];

const LEGACY_MAP: Record<string, OrderWorkflowStatus> = {
  pending: "pending_payment",
  payment_pending: "pending_payment",
  unpaid: "pending_payment",
  completed: "delivered",
  cancelled: "cancelled",
};

export function normalizeOrderStatus(raw: string): OrderWorkflowStatus {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if ((ORDER_WORKFLOW_VALUES as readonly string[]).includes(s)) {
    return s as OrderWorkflowStatus;
  }
  return LEGACY_MAP[s] ?? "pending_payment";
}

export function orderWorkflowLabel(status: OrderWorkflowStatus): string {
  const labels: Record<OrderWorkflowStatus, string> = {
    pending_payment: "Awaiting payment",
    paid: "Paid",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return labels[status];
}

export function badgeClassForWorkflow(
  status: OrderWorkflowStatus,
): string {
  switch (status) {
    case "delivered":
      return "bg-emerald-700 text-white dark:bg-emerald-900";
    case "shipped":
      return "bg-sky-700 text-white dark:bg-sky-900";
    case "processing":
    case "paid":
      return "bg-amber-700 text-white dark:bg-amber-900";
    case "pending_payment":
      return "bg-neutral-600 text-white dark:bg-neutral-800";
    case "cancelled":
      return "bg-rose-800 text-white dark:bg-red-950";
    case "refunded":
      return "bg-violet-800 text-white dark:bg-violet-950";
    default:
      return "bg-neutral-600 text-white";
  }
}

/** Filter presets for the orders list UI. */
export type OrderQueueFilter =
  | "all"
  /** Paid or awaiting payment — seller action before moving to Processing. */
  | "new_orders"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const QUEUE_QP_ALIASES: Record<string, OrderQueueFilter> = {
  all: "all",
  new: "new_orders",
  new_orders: "new_orders",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  refunded: "refunded",
};

/** Resolve `?queue=` for `/admin/orders` (supports `new`, `new_orders`, etc.). */
export function orderQueueFromSearchParam(
  raw: string | null | undefined,
): OrderQueueFilter | null {
  if (raw == null) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (!key) return null;
  return QUEUE_QP_ALIASES[key] ?? null;
}

export function orderMatchesQueueFilter(
  normalized: OrderWorkflowStatus,
  filter: OrderQueueFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "new_orders") {
    return normalized === "pending_payment" || normalized === "paid";
  }
  return normalized === filter;
}
