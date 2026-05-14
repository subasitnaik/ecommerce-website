"use client";

import type { StoreProduct } from "@/data/mock-products";
import { ClothingProductCard } from "./clothing-product-card";

type Props = {
  title: string;
  products: StoreProduct[];
};

export function ClothingFeaturedRail({ title, products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">{title}</h2>
        <div
          className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p, i) => (
            <div
              key={p.id}
              className="w-[45%] max-w-[200px] shrink-0 snap-start sm:w-[28%] sm:max-w-[220px] md:max-w-[240px]"
            >
              <ClothingProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
