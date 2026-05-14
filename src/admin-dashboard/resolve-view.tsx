import type { ComponentType } from "react";
import LandingV2 from "./views/LandingV2";
import CreateProduct from "./views/CreateProduct";
import EditProduct from "./views/EditProduct";
import CreateCategory from "./views/CreateCategory";
import EditCategory from "./views/EditCategory";
import CreateOrder from "./views/CreateOrder";
import EditOrder from "./views/EditOrder";
import CreateReview from "./views/CreateReview";
import EditReview from "./views/EditReview";

/** Maps `/admin/...` segments to dashboard views. */
export function resolveAdminView(
  slug: string[] | undefined,
): ComponentType | null {
  const s = slug ?? [];

  const a = s[0];
  const b = s[1];

  if (a === "landing-v2" && s.length === 1) return LandingV2;

  if (a === "products" && b === "create-product") return CreateProduct;
  if (a === "products" && s.length === 2 && b && b !== "create-product")
    return EditProduct;

  if (a === "categories" && b === "create-category") return CreateCategory;
  if (a === "categories" && s.length === 2 && b && b !== "create-category")
    return EditCategory;

  if (a === "orders" && b === "create-order") return CreateOrder;
  if (a === "orders" && s.length === 2 && b && b !== "create-order")
    return EditOrder;

  if (a === "reviews" && b === "create-review") return CreateReview;
  if (a === "reviews" && s.length === 2 && b && b !== "create-review")
    return EditReview;

  return null;
}
