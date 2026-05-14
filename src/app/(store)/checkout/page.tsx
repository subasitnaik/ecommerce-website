import { getShopSettings } from "@/lib/shop-settings";
import { isCashfreeConfigured } from "@/lib/cashfree-config";
import CheckoutClient from "./checkout-client";

export default async function CheckoutPage() {
  const settings = await getShopSettings();
  return (
    <CheckoutClient
      initialShopConfig={{
        codEnabled: settings.codEnabled,
        cashfreeConfigured: isCashfreeConfigured(),
      }}
    />
  );
}
