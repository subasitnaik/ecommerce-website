import Link from "next/link";
import { auth } from "@/auth";
import { getAdminDashboardStats } from "@/lib/admin-dashboard-stats";
import { formatMoney } from "@/lib/format";
import { AdminShell } from "../AdminShell";

export const dynamic = "force-dynamic";

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 22) return "Good evening";
  return "Good evening";
}

function displayName(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const n = name?.trim();
  if (n) return n;
  const local = email?.split("@")[0]?.trim();
  if (local) return local;
  return "Admin";
}

export default async function AdminHome() {
  const session = await auth();
  const name = displayName(session?.user?.name, session?.user?.email);
  const stats = await getAdminDashboardStats();

  return (
    <AdminShell>
      <div className="px-4 py-10 sm:px-8 lg:px-12">
        <h1 className="text-2xl font-bold text-blackPrimary dark:text-whiteSecondary sm:text-3xl">
          {timeGreeting()}, {name} 😀
        </h1>

        <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          <Link
            href="/admin/orders?queue=new_orders"
            className="rounded-xl border border-gray-200 bg-white/80 px-5 py-4 transition hover:border-gray-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
          >
            <p className="text-sm font-medium text-blackPrimary/70 dark:text-whiteSecondary/70">
              New orders
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-blackPrimary dark:text-whiteSecondary">
              {stats.ordersNeedingAction}
            </p>
            <p className="mt-1 text-xs text-blackPrimary/50 dark:text-whiteSecondary/50">
              Awaiting payment or paid — open to process (
              <span className="tabular-nums">{stats.unseenOrders}</span> never
              opened in admin)
            </p>
          </Link>
          <div className="rounded-xl border border-gray-200 bg-white/80 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900/80">
            <p className="text-sm font-medium text-blackPrimary/70 dark:text-whiteSecondary/70">
              Total orders
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-blackPrimary dark:text-whiteSecondary">
              {stats.totalOrders}
            </p>
            <p className="mt-1 text-xs text-blackPrimary/50 dark:text-whiteSecondary/50">
              All time
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white/80 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900/80 sm:col-span-1">
            <p className="text-sm font-medium text-blackPrimary/70 dark:text-whiteSecondary/70">
              Total revenue
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-blackPrimary dark:text-whiteSecondary">
              {formatMoney(stats.totalRevenueCents, stats.currency)}
            </p>
            <p className="mt-1 text-xs text-blackPrimary/50 dark:text-whiteSecondary/50">
              Sum of all order totals
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
