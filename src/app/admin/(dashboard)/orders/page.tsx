import OrdersClient from "@/admin-dashboard/views/OrdersClient";
import { getAdminOrdersForList } from "@/lib/admin-orders";
import { parseCourierPresets } from "@/lib/courier-presets";
import { orderQueueFromSearchParam } from "@/lib/order-workflow";
import { getShopSettings } from "@/lib/shop-settings";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ queue?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const qp = await searchParams;
  const initialQueue = orderQueueFromSearchParam(qp.queue);
  const [initialOrders, settings] = await Promise.all([
    getAdminOrdersForList(),
    getShopSettings(),
  ]);
  const initialCourierPresets = parseCourierPresets(settings.courierPresets);
  return (
    <OrdersClient
      initialOrders={initialOrders}
      initialCourierPresets={initialCourierPresets}
      initialQueue={initialQueue}
    />
  );
}
