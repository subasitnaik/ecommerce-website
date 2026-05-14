import Link from "next/link";
import { sf } from "@/lib/storefront-ui";
import { CheckoutSuccessExtras } from "../checkout-success-extras";

type Props = {
  searchParams: Promise<{ method?: string; order?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { method } = await searchParams;
  const cod = method === "cod";
  const paid = method === "paid";

  return (
    <div className={sf.pageCenter}>
      <h1 className={sf.h1Lg}>
        {cod ? "Order placed" : paid ? "Thank you" : "Thank you"}
      </h1>
      <p className={`${sf.body} mt-3`}>
        {cod
          ? "We received your cash on delivery order."
          : paid
            ? "Your payment was successful and your order is confirmed."
            : "Your order was completed."}
      </p>
      <CheckoutSuccessExtras />
      <Link
        href="/products"
        className={`${sf.btnBlack} mt-8`}
      >
        Continue shopping
      </Link>
    </div>
  );
}
