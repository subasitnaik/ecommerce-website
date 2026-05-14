import { AdminShell } from "@/admin-dashboard/AdminShell";
import { CouponsSection } from "./coupons-section";

export const dynamic = "force-dynamic";

export default function AdminCouponsPage() {
  return (
    <AdminShell>
      <div className="px-4 py-10 sm:px-8 lg:px-12">
        <h1 className="text-3xl font-bold text-blackPrimary dark:text-whiteSecondary">
          Discount coupons
        </h1>
        <p className="mt-2 max-w-2xl text-base text-blackPrimary/80 dark:text-whiteSecondary/80">
          Manage promotional codes for your store. This area is split into two
          parts: create new codes, then review and control existing ones.
        </p>

        <div className="mt-10 max-w-4xl min-w-0">
          <CouponsSection />
        </div>
      </div>
    </AdminShell>
  );
}
