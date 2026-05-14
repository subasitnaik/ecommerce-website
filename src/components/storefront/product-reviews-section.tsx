"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sf } from "@/lib/storefront-ui";
import { StarRow } from "./product-review-stars";

export type PdpReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  imageUrls?: string[];
};

export type GallerySlide = {
  slideId: string;
  imageUrl: string;
  review: PdpReviewItem;
};

const MAX_STRIP_SLIDES = 10;

/** Flatten reviews’ images into scrollable/lightbox slides (cap for strip). */
export function buildReviewGallerySlides(
  reviews: PdpReviewItem[],
): GallerySlide[] {
  const slides: GallerySlide[] = [];
  for (const r of reviews) {
    const imgs = r.imageUrls?.filter(Boolean) ?? [];
    for (let i = 0; i < imgs.length; i++) {
      slides.push({
        slideId: `${r.id}:${i}`,
        imageUrl: imgs[i]!,
        review: r,
      });
    }
  }
  return slides.slice(0, MAX_STRIP_SLIDES);
}

type LightboxProps = {
  slides: GallerySlide[];
  activeIndex: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

function ReviewImageLightbox({
  slides,
  activeIndex,
  open,
  onClose,
  onNavigate,
}: LightboxProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && activeIndex > 0) onNavigate(activeIndex - 1);
      if (e.key === "ArrowRight" && activeIndex < slides.length - 1)
        onNavigate(activeIndex + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIndex, slides.length, onClose, onNavigate]);

  if (!open || slides.length === 0) return null;

  const slide = slides[activeIndex];
  if (!slide) return null;

  const { review, imageUrl } = slide;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-lightbox-caption"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-default border-0 p-0"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />

      <div className="relative z-[1] mx-auto flex h-full max-h-[100dvh] min-h-0 w-full max-w-3xl flex-col px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5">
        <div className="flex shrink-0 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="relative mx-auto mt-3 flex min-h-[min(40vh,360px)] w-full flex-1 items-center justify-center sm:mx-0 sm:mt-4 sm:h-auto sm:min-h-0 sm:max-h-[min(62vh,600px)] sm:flex-none">
          {slides.length > 1 ? (
            <button
              type="button"
              disabled={activeIndex <= 0}
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(activeIndex - 1);
              }}
              className="absolute start-1 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-neutral-950/70 text-xl text-white transition enabled:hover:bg-white/15 disabled:opacity-35"
            >
              ‹
            </button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="relative z-[1] max-h-[min(54vh,520px)] max-w-full object-contain sm:max-h-[min(58vh,560px)]"
          />
          {slides.length > 1 ? (
            <button
              type="button"
              disabled={activeIndex >= slides.length - 1}
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(activeIndex + 1);
              }}
              className="absolute end-1 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-neutral-950/70 text-xl text-white transition enabled:hover:bg-white/15 disabled:opacity-35"
            >
              ›
            </button>
          ) : null}
        </div>

        <div id="review-lightbox-caption" className="mt-4 min-h-0 shrink-0 overflow-y-auto pb-6 sm:mt-6 sm:flex-initial">
          <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-neutral-950/80 p-4 text-neutral-50 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{review.authorName}</span>
              <time
                dateTime={review.createdAt}
                className="text-xs tabular-nums text-neutral-400"
              >
                {new Date(review.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>
            <p className="mt-2">
              <StarRow rating={review.rating} className="text-base" />
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
              {review.comment}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductReviewsSection({ reviews }: { reviews: PdpReviewItem[] }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const slides = useMemo(() => buildReviewGallerySlides(reviews), [reviews]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openAt = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const stripScrollBy = useCallback((dir: -1 | 1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(340, el.clientWidth * 0.72), behavior: "smooth" });
  }, []);

  return (
    <section
      id="reviews"
      className="mt-20 scroll-mt-[calc(3rem+1px+12px)] sm:scroll-mt-[calc(3.5rem+1px+12px)] sm:mt-24"
    >
      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />
      <div className="pt-10 sm:pt-12">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 sm:text-xl">
          {reviews.length === 0
            ? "What people say"
            : `What people say (${reviews.length})`}
        </h2>

        {reviews.length === 0 ? (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Nothing here yet — be the first to review after you order.
          </p>
        ) : (
          <>
            {slides.length > 0 ? (
              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                  From shoppers
                </p>
                <div className="sticky top-[calc(3rem+1px)] z-40 -mx-4 border-b border-black/[0.06] bg-white/95 pb-4 pt-1 backdrop-blur-md dark:border-white/10 dark:bg-stone-950/95 sm:-mx-6 sm:top-[calc(3.5rem+1px)] lg:-mx-8">
                  <div className="relative">
                  <button
                    type="button"
                    aria-label="Scroll reviews left"
                    onClick={() => stripScrollBy(-1)}
                    className="absolute start-1 top-1/2 z-[2] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-300 bg-white/95 text-neutral-800 shadow hover:bg-neutral-50 sm:flex dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Scroll reviews right"
                    onClick={() => stripScrollBy(1)}
                    className="absolute end-1 top-1/2 z-[2] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-300 bg-white/95 text-neutral-800 shadow hover:bg-neutral-50 sm:flex dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    ›
                  </button>
                  <div
                    ref={stripRef}
                    className="-mx-1 flex gap-3 overflow-x-auto scroll-smooth pb-3 pt-1 [scrollbar-width:none] sm:gap-4 sm:px-8 [&::-webkit-scrollbar]:hidden"
                  >
                    {slides.map((s, idx) => (
                      <button
                        key={s.slideId}
                        type="button"
                        className={`${sf.cardInert} w-[min(12.5rem,calc((100vw-3rem)*0.72))] shrink-0 overflow-hidden rounded-lg text-start ring-2 ring-transparent transition hover:ring-neutral-900/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:ring-white/20`}
                        onClick={() => openAt(idx)}
                      >
                        <span className="relative block aspect-[4/5] w-full bg-neutral-200 dark:bg-neutral-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.imageUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        </span>
                        <div className="border-t border-black/10 p-2.5 dark:border-white/10">
                          <p className="line-clamp-1 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                            {s.review.authorName}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
                            {s.review.comment}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            ) : null}

            <ul className={`grid gap-4 sm:gap-5 ${slides.length > 0 ? "mt-8 sm:mt-10" : "mt-6"}`}>
              {reviews.map((r) => (
                <li key={r.id} className={`${sf.cardInert} p-4 sm:p-5`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {r.authorName}
                    </span>
                    <time
                      dateTime={r.createdAt}
                      className="text-xs tabular-nums text-neutral-500 dark:text-neutral-500"
                    >
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm leading-none">
                    <StarRow rating={r.rating} className="text-sm leading-none" />
                  </p>
                  {(r.imageUrls?.filter(Boolean).length ?? 0) > 0 ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
                      {r.imageUrls!.filter(Boolean).map((src, ii) => {
                        const slideIdx = slides.findIndex(
                          (sl) => sl.slideId === `${r.id}:${ii}`,
                        );
                        return (
                          <button
                            key={`${r.id}-${ii}`}
                            type="button"
                            className={`${sf.cardInert} h-28 w-[5.75rem] shrink-0 overflow-hidden rounded-md ring-2 ring-transparent transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:h-36 sm:w-28`}
                            onClick={() => {
                              if (slideIdx >= 0) openAt(slideIdx);
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {r.comment}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ReviewImageLightbox
        slides={slides}
        activeIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </section>
  );
}
