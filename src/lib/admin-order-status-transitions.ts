import type { OrderWorkflowStatus } from "@/lib/order-workflow";

/**
 * Validates admin PATCH status transitions (paired with shipment rules on the PATCH route).
 */
export function validateAdminOrderStatusTransition(
  from: OrderWorkflowStatus,
  to: OrderWorkflowStatus,
  ctx: { mergedTN: string | null; mergedPID: string | null },
): string | null {
  if (from === to) return null;

  if (from === "pending_payment" || from === "paid") {
    if (to !== "processing") {
      return "From Paid / Awaiting payment you can only move the order to Processing.";
    }
    return null;
  }

  if (from === "processing" && to === "shipped") {
    if (!ctx.mergedTN?.trim() || !ctx.mergedPID?.trim()) {
      return "AWB and courier preset are required to mark an order Shipped.";
    }
    return null;
  }

  if (from === "shipped" && to === "delivered") {
    return null;
  }

  return `Cannot change status from ${from} to ${to}.`;
}

/** Dropdown options shown in OrderTable — restrict dangerous jumps. */
export function adminOrderStatusDropdownOptions(
  normalized: OrderWorkflowStatus,
): OrderWorkflowStatus[] {
  switch (normalized) {
    case "pending_payment":
      return ["pending_payment", "processing"];
    case "paid":
      return ["paid", "processing"];
    case "processing":
      return ["processing", "shipped"];
    case "shipped":
      return ["shipped", "delivered"];
    case "delivered":
    case "cancelled":
    case "refunded":
      return [normalized];
    default:
      return ["pending_payment", "processing"];
  }
}
