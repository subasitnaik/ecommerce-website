/**
 * Shared classes for the clothing storefront (light theme only).
 */
export const sf = {
  page: "mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8",
  pageNarrow: "mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8",
  pageCenter: "mx-auto max-w-lg px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8",
  pageProduct: "mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pb-28 sm:pt-8",
  crNav: "text-sm text-neutral-500",
  crLink: "transition hover:text-neutral-900",
  crSep: "text-neutral-300",
  crCurrent: "font-medium text-neutral-800",
  h1: "text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl",
  h1Lg: "text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl",
  sub: "text-sm text-neutral-600",
  body: "text-base leading-relaxed text-neutral-600",
  linkMuted:
    "text-sm font-medium text-neutral-500 transition hover:text-neutral-900",
  btnBlack:
    "inline-flex h-12 min-w-[12rem] max-w-full items-center justify-center rounded-md bg-black px-4 text-sm font-semibold text-white transition hover:bg-neutral-800",
  btnBlackFull:
    "flex h-12 w-full items-center justify-center rounded-md bg-black text-sm font-semibold text-white transition hover:bg-neutral-800",
  card: "rounded-lg border border-black/10 bg-white",
  cardInert: "rounded-lg border border-neutral-200 bg-white",
  input:
    "mt-1.5 w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/20",
} as const;
