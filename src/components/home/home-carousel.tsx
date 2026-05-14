"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CarouselSlide } from "@/types/home";

function SlideWrap({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  const frame =
    "block overflow-hidden rounded-lg ring-1 ring-stone-200 transition hover:opacity-95 dark:ring-stone-600";
  if (!href) {
    return <div className={frame}>{children}</div>;
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={frame}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={frame}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export function HomeCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const s = slides[index]!;

  return (
    <section className="order-first w-full shrink-0 border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
      <div className="mx-auto max-w-7xl px-5 pb-4 pt-4 sm:px-8 sm:pt-5 lg:px-10">
        <SlideWrap href={s.href}>
          <div className="relative aspect-video w-full bg-stone-200 dark:bg-stone-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.imageUrl}
              alt={s.alt ?? "Promotional banner"}
              className="h-full w-full object-cover"
            />
          </div>
        </SlideWrap>

        {slides.length > 1 ? (
          <div className="mt-3 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition ${
                  i === index
                    ? "w-6 bg-stone-800 dark:bg-stone-200"
                    : "w-1.5 bg-stone-300 hover:bg-stone-400 dark:bg-stone-600 dark:hover:bg-stone-500"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
