"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CarouselSlide } from "@/types/home";

function HeroSlideWrap({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return <div className="block h-full w-full overflow-hidden bg-neutral-200">{children}</div>;
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} className="block h-full w-full overflow-hidden">
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className="block h-full w-full overflow-hidden" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function ClothingHero({ slides }: { slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <section className="w-full border-b border-black/5 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="min-h-[min(50vh,420px)] overflow-hidden rounded-none bg-gradient-to-b from-neutral-200 to-neutral-100 sm:rounded-b-lg"
            aria-hidden
          />
        </div>
      </section>
    );
  }

  const s = slides[index]!;

  return (
    <section className="w-full border-b border-black/5 bg-white">
      <div className="mx-auto w-full max-w-7xl px-0 sm:px-4 lg:px-8">
        <div className="overflow-hidden sm:rounded-b-lg">
          <div className="relative aspect-[4/5] w-full min-h-[280px] max-h-[min(75vh,640px)] sm:aspect-[16/9] sm:min-h-0 sm:max-h-[min(70vh,560px)]">
            <HeroSlideWrap href={s.href}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.imageUrl}
                alt={s.alt ?? ""}
                className="h-full w-full object-cover object-center"
              />
            </HeroSlideWrap>
            {slides.length > 1 ? (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 sm:bottom-4">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition ${
                      i === index ? "w-6 bg-white shadow" : "w-1.5 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
