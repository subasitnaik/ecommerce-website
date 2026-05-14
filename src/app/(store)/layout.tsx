import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingWhatsapp } from "@/components/floating-whatsapp";
import { CartProvider } from "@/components/cart/cart-context";
import { ShopNameFontLink } from "@/components/shop-name-font-link";
import { StorefrontLightMode } from "@/components/storefront-light-mode";
import { getShopSettings } from "@/lib/shop-settings";
import { getShopNameFontById, shopNameFontCssStack } from "@/lib/shop-name-fonts";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getShopSettings();
  const fontEntry = getShopNameFontById(settings.shopNameFont);
  const googleFamily = fontEntry?.googleFamily
    ? fontEntry.googleFamily
    : null;
  const shopNameFontStack = shopNameFontCssStack(fontEntry);

  return (
    <CartProvider>
      <StorefrontLightMode />
      <ShopNameFontLink googleFamily={googleFamily} />
      <div className="flex min-h-[100dvh] flex-col">
        <SiteHeader shopNameFontStack={shopNameFontStack} />
        <main className="min-h-0 flex-1 bg-white text-neutral-900">
          {children}
        </main>
        <SiteFooter />
        <FloatingWhatsapp />
      </div>
    </CartProvider>
  );
}
