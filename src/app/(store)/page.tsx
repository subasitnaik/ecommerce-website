import { ClothingCategoryRail } from "@/components/home/clothing-category-rail";
import { ClothingFeaturedRail } from "@/components/home/clothing-featured-rail";
import { ClothingHero } from "@/components/home/clothing-hero";
import { HomeAboutBlock } from "@/components/home/home-about-block";
import { HomeFaqAccordion } from "@/components/home/home-faq-accordion";
import { HomeProductSection } from "@/components/home/home-product-section";
import { siteConfig } from "@/config";
import {
  getAllProductsPaginatedForHome,
  getHomeAboveProductsRails,
  getHomeCategories,
} from "@/lib/catalog";
import { getShopSettings } from "@/lib/shop-settings";
import {
  getCarouselSlidesForHome,
  parseStoredHomeHighlightRails,
} from "@/types/home";

type Props = { searchParams: Promise<{ page?: string }> };

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const settings = await getShopSettings();
  const highlights = parseStoredHomeHighlightRails(
    settings.homeHighlightRails,
    settings.homeProductMode,
  );
  const perPage = Math.min(
    24,
    Math.max(3, settings.homeProductsPerPage || 6),
  );

  const [categories, rails, productBlock] = await Promise.all([
    getHomeCategories(),
    getHomeAboveProductsRails({ highlights, take: 8 }),
    getAllProductsPaginatedForHome({ page, perPage }),
  ]);

  const slides = getCarouselSlidesForHome(settings.carouselSlides);
  const { products, totalPages } = productBlock;

  return (
    <div className="flex min-w-0 flex-col">
      <ClothingHero slides={slides} />
      <ClothingCategoryRail categories={categories} />
      {rails.map((rail, i) => (
        <ClothingFeaturedRail
          key={`${rail.heading}-${i}`}
          title={rail.heading}
          products={rail.products}
        />
      ))}
      <HomeProductSection
        title="All products"
        products={products}
        page={page}
        totalPages={totalPages}
        clothingLayout
      />
      <HomeFaqAccordion items={siteConfig.home.faq} />
      <HomeAboutBlock
        title={siteConfig.home.aboutTitle}
        body={siteConfig.home.about}
      />
    </div>
  );
}
