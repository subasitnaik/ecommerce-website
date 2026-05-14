import ProductsClient from "@/admin-dashboard/views/ProductsClient";
import { getCatalogProductsForAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const items = await getCatalogProductsForAdmin();
  return <ProductsClient items={items} />;
}
