import ReviewsClient from "@/admin-dashboard/views/ReviewsClient";
import { getReviewsForAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const items = await getReviewsForAdmin();
  return <ReviewsClient items={items} />;
}
