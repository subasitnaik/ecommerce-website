export type AdminDashboardStats = {
  unseenOrders: number;
  /** `pending_payment` + `paid` — shown in Orders → New orders. */
  ordersNeedingAction: number;
  totalOrders: number;
  totalRevenueCents: number;
  currency: string;
};

const empty: AdminDashboardStats = {
  unseenOrders: 0,
  ordersNeedingAction: 0,
  totalOrders: 0,
  totalRevenueCents: 0,
  currency: "INR",
};

/**
 * Real counts from the database. If the DB is unavailable, returns zeros.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const [unseenOrders, ordersNeedingAction, totalOrders, sumRow, lastOrder] =
      await Promise.all([
      prisma.order.count({ where: { adminSeenAt: null } }),
      prisma.order.count({
        where: {
          status: {
            in: [
              "pending_payment",
              "paid",
              "pending",
              "payment_pending",
              "unpaid",
            ],
          },
        },
      }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalCents: true } }),
      prisma.order.findFirst({
        orderBy: { createdAt: "desc" },
        select: { currency: true },
      }),
    ]);
    return {
      unseenOrders,
      ordersNeedingAction,
      totalOrders,
      totalRevenueCents: sumRow._sum.totalCents ?? 0,
      currency: lastOrder?.currency ?? "INR",
    };
  } catch {
    return { ...empty };
  }
}
