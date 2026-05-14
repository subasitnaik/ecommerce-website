export function ensureMatrix(
  rows: number,
  cols: number,
  prev: number[][],
): number[][] {
  const next: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(prev[r]?.[c] ?? 0);
    }
    next.push(row);
  }
  return next;
}

export function buildSizesPayload(
  sizeRows: { label: string; priceRupees: string }[],
):
  | { ok: true; sizes: { label: string; priceRupees: number | null }[] }
  | { ok: false; error: string } {
  const out: { label: string; priceRupees: number | null }[] = [];
  for (const r of sizeRows) {
    const label = r.label.trim();
    if (!label) {
      return { ok: false, error: "Each size needs a name." };
    }
    const pr = r.priceRupees.trim();
    if (pr === "") {
      out.push({ label, priceRupees: null });
    } else {
      const n = parseFloat(pr.replace(/,/g, ""));
      if (Number.isNaN(n) || n < 0) {
        return {
          ok: false,
          error:
            "Size prices must be valid numbers ≥ 0, or left blank to use the base price.",
        };
      }
      out.push({ label, priceRupees: n });
    }
  }
  if (out.length < 1) {
    return {
      ok: false,
      error: "Add at least one size (e.g. S, M, L or 28, 30).",
    };
  }
  return { ok: true, sizes: out };
}

export type UnavailablePairForm = {
  sizeIndex: number;
  variantIndex: number;
};

/** Keep only in-range, deduped pairs when size/variant row counts change. */
export function ensureUnavailablePairs(
  prev: UnavailablePairForm[],
  nSizes: number,
  nVariants: number,
): UnavailablePairForm[] {
  const seen = new Set<string>();
  const out: UnavailablePairForm[] = [];
  for (const p of prev) {
    if (
      p.sizeIndex >= 0 &&
      p.sizeIndex < nSizes &&
      p.variantIndex >= 0 &&
      p.variantIndex < nVariants
    ) {
      const k = `${p.variantIndex}::${p.sizeIndex}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(p);
      }
    }
  }
  return out;
}
