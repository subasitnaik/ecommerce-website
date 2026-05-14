import CategoriesClient from "@/admin-dashboard/views/CategoriesClient";
import { getCatalogCategoriesForAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const items = await getCatalogCategoriesForAdmin();
  return <CategoriesClient items={items} />;
}
