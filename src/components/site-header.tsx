import { ClothingHeader } from "@/components/clothing-header";

type Props = {
  /** `font-family` stack when a custom Google Font is chosen in website settings. */
  shopNameFontStack?: string | null;
};

export function SiteHeader({ shopNameFontStack }: Props = {}) {
  return <ClothingHeader shopNameFontStack={shopNameFontStack} />;
}
