import { AdminShell } from "@/admin-dashboard/AdminShell";
import { parseStoredShopNameFontId } from "@/lib/shop-name-fonts";
import { getCatalogCategoriesForAdmin } from "@/lib/catalog";
import { getShopSettings } from "@/lib/shop-settings";
import {
  filterRailsToKnownCategories,
  parseCarouselSlides,
  railsStorageStringsFromSettings,
} from "@/types/home";
import { HiOutlineChevronRight } from "react-icons/hi";
import { WebsiteSettingsForm } from "./website-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminWebsiteSettingsPage() {
  const [settings, catalogCategories] = await Promise.all([
    getShopSettings(),
    getCatalogCategoriesForAdmin(),
  ]);

  const sortedCategories = [...catalogCategories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const homeHighlightRails = filterRailsToKnownCategories(
    railsStorageStringsFromSettings(
      settings.homeHighlightRails,
      settings.homeProductMode,
    ),
    sortedCategories,
  );
  return (
    <AdminShell>
      <div className="min-h-0 w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mx-auto mb-8 max-w-6xl border-b border-blackSecondary pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-blackPrimary dark:text-whiteSecondary sm:text-3xl">
            Website settings
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-blackPrimary/75 dark:text-whiteSecondary/75 sm:text-base">
            <span>Dashboard</span>
            <HiOutlineChevronRight className="inline shrink-0 text-lg opacity-70" aria-hidden />
            <span className="font-medium text-blackPrimary dark:text-whiteSecondary">
              Website settings
            </span>
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-blackPrimary/75 dark:text-whiteSecondary/75 sm:text-[0.9375rem]">
            Control how the storefront home page and checkout behave. Promo codes live under{" "}
            <span className="font-medium text-blackPrimary dark:text-whiteSecondary">
              Discount coupons
            </span>{" "}
            in the sidebar. Cashfree credentials only exist in server environment variables.
          </p>
        </header>

        <div className="mx-auto max-w-6xl">
          <WebsiteSettingsForm
            initialCodEnabled={settings.codEnabled}
            initialCarouselSlides={parseCarouselSlides(settings.carouselSlides)}
            initialHomeHighlightRails={homeHighlightRails}
            initialHomeProductsPerPage={settings.homeProductsPerPage}
            initialShopNameFontId={parseStoredShopNameFontId(settings.shopNameFont)}
            highlightCategoryOptions={sortedCategories.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: c.name,
            }))}
          />
        </div>
      </div>
    </AdminShell>
  );
}
