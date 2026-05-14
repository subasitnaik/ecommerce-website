const STAR_GOLD = "text-amber-500 dark:text-amber-400/90";
const STAR_EMPTY_GLYPH_CLASS = "text-neutral-300 dark:text-neutral-600";

function HalfGoldStarGlyph() {
  return (
    <span className="relative inline-block shrink-0 leading-none" aria-hidden>
      <span className={STAR_EMPTY_GLYPH_CLASS}>★</span>
      <span className="absolute left-0 top-0 w-1/2 overflow-hidden whitespace-nowrap">
        <span className={STAR_GOLD}>★</span>
      </span>
    </span>
  );
}

/** Renders 0–5 stars in ½-step increments (e.g. 4.5 → four filled + one half). */
export function StarRow({
  rating,
  className = "text-base",
}: {
  rating: number;
  className?: string;
}) {
  const clamped = Math.min(5, Math.max(0, rating));
  const display = Math.round(clamped * 2) / 2;
  const fullStars = Math.floor(display);
  const hasHalfStar = display - fullStars >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

  return (
    <span
      className={`inline-flex items-center gap-px tabular-nums leading-none tracking-tighter ${className}`}
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: fullStars }, (_, i) => (
        <span key={`f-${i}`} className={STAR_GOLD} aria-hidden>
          ★
        </span>
      ))}
      {hasHalfStar ? <HalfGoldStarGlyph /> : null}
      {Array.from({ length: emptyStars }, (_, i) => (
        <span key={`e-${i}`} className={STAR_EMPTY_GLYPH_CLASS} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}
