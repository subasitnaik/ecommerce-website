import { notFound } from "next/navigation";
import { ProductPdpClient } from "@/components/storefront/product-pdp-client";
import {
  getCatalogProductBySlug,
  getReviewsForProductSlug,
} from "@/lib/catalog";
import { siteConfig } from "@/config";

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) notFound();

  const reviews = await getReviewsForProductSlug(slug);
  const shopName = siteConfig.name;

  const reviewsPayload = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    imageUrls: r.imageUrls,
  }));

  return (
    <ProductPdpClient product={product} shopName={shopName} reviews={reviewsPayload} />
  );
}
