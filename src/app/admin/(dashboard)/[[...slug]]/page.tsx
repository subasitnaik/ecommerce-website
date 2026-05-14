import { notFound } from "next/navigation";
import AdminHome from "@/admin-dashboard/views/AdminHome";
import { resolveAdminView } from "@/admin-dashboard/resolve-view";

type Props = { params: Promise<{ slug?: string[] }> };

export default async function AdminDashboardCatchAll({ params }: Props) {
  const { slug } = await params;
  const segments = slug ?? [];
  if (segments.length === 0) {
    return <AdminHome />;
  }
  const View = resolveAdminView(segments);
  if (!View) notFound();
  return <View />;
}
