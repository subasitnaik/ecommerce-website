"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { makeCartLineId, type CartLine } from "@/lib/cart-types";

const STORAGE_KEY = "ecommerce-template:cart";
const CART_V = 2 as const;
const LEGACY_CART_V = 1 as const;

export type AppliedCoupon = {
  code: string;
  discountCents: number;
};

type CartPersistV2 = {
  v: typeof CART_V;
  lines: CartLine[];
  coupon: AppliedCoupon | null;
};

function ensureCartLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.productId !== "string") return null;
  const q = o.quantity;
  if (typeof q !== "number" || !Number.isFinite(q)) return null;
  const sizeId =
    o.sizeId == null
      ? null
      : String(o.sizeId) === ""
        ? null
        : String(o.sizeId);
  const sizeLabel =
    o.sizeLabel == null && o.size != null
      ? String(o.size)
      : o.sizeLabel == null
        ? null
        : String(o.sizeLabel);
  const sizeLegacy = o.size == null ? null : String(o.size);
  const variantId = o.variantId == null ? null : String(o.variantId);
  const variantLabel = o.variantLabel == null ? null : String(o.variantLabel);
  const lineId =
    typeof o.lineId === "string" && o.lineId.length > 0
      ? o.lineId
      : makeCartLineId(o.productId, {
          sizeId,
          sizeLabel: sizeLabel ?? sizeLegacy,
          variantId,
        });
  return {
    lineId,
    productId: o.productId,
    slug: typeof o.slug === "string" ? o.slug : "",
    name: typeof o.name === "string" ? o.name : "",
    priceCents: typeof o.priceCents === "number" ? o.priceCents : 0,
    currency: typeof o.currency === "string" ? o.currency : "INR",
    imageUrl: o.imageUrl === null || typeof o.imageUrl === "string" ? o.imageUrl : null,
    quantity: Math.max(1, Math.floor(q)),
    sizeId: sizeId === "" ? null : sizeId,
    sizeLabel: sizeLabel === "" ? null : sizeLabel ?? sizeLegacy,
    size: sizeLabel ?? sizeLegacy,
    variantId: variantId === "" ? null : variantId,
    variantLabel: variantLabel === "" ? null : variantLabel,
  };
}

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  appliedCoupon: AppliedCoupon | null;
  discountCents: number;
  totalCents: number;
  addLine: (line: Omit<CartLine, "quantity" | "lineId"> & { quantity?: number; lineId?: string }) => void;
  removeLine: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  applyCoupon: (rawCode: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeCoupon: () => void;
  ready: boolean;
  couponRevalidating: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadFromStorage(
  raw: string | null,
): { lines: CartLine[]; coupon: AppliedCoupon | null } {
  if (!raw) return { lines: [], coupon: null };
  try {
    const p = JSON.parse(raw) as unknown;
    if (Array.isArray(p)) {
      const lines = p
        .map(ensureCartLine)
        .filter((x): x is CartLine => x !== null);
      return { lines, coupon: null };
    }
    if (p && typeof p === "object") {
      const v = (p as { v?: number }).v;
      if (v === CART_V || v === LEGACY_CART_V) {
        const o = p as CartPersistV2;
        const rawLines = Array.isArray(o.lines) ? o.lines : [];
        const lines = rawLines
          .map(ensureCartLine)
          .filter((x): x is CartLine => x !== null);
        const c = o.coupon;
        if (
          c &&
          typeof c.code === "string" &&
          typeof c.discountCents === "number"
        ) {
          return { lines, coupon: c };
        }
        return { lines, coupon: null };
      }
    }
  } catch {
    /* ignore */
  }
  return { lines: [], coupon: null };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const [couponRevalidating, setCouponRevalidating] = useState(false);

  useEffect(() => {
    const { lines: l, coupon: c } = loadFromStorage(
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null,
    );
    setLines(l);
    setAppliedCoupon(c);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      const payload: CartPersistV2 = {
        v: CART_V,
        lines,
        coupon: appliedCoupon,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [lines, appliedCoupon, ready]);

  const subtotalCents = useMemo(
    () => lines.reduce((s, l) => s + l.priceCents * l.quantity, 0),
    [lines],
  );

  useEffect(() => {
    if (!ready) return;

    if (!appliedCoupon) {
      setCouponRevalidating(false);
      return;
    }

    if (lines.length === 0) {
      setAppliedCoupon(null);
      setCouponRevalidating(false);
      return;
    }

    let cancelled = false;
    setCouponRevalidating(true);
    void (async () => {
      try {
        const res = await fetch("/api/shop/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: appliedCoupon.code,
            subtotalCents,
          }),
        });
        const data = (await res.json()) as {
          discountCents?: number;
          error?: string;
        };
        if (cancelled) return;
        if (res.ok && typeof data.discountCents === "number") {
          setAppliedCoupon((prev) => {
            if (!prev || prev.code !== appliedCoupon.code) return prev;
            if (prev.discountCents === data.discountCents) return prev;
            return { code: prev.code, discountCents: data.discountCents! };
          });
        } else {
          setAppliedCoupon(null);
        }
      } catch {
        if (!cancelled) setAppliedCoupon(null);
      } finally {
        if (!cancelled) setCouponRevalidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, lines, subtotalCents, appliedCoupon?.code]);

  const addLine = useCallback(
    (
      line: Omit<CartLine, "quantity" | "lineId"> & {
        quantity?: number;
        lineId?: string;
      },
    ) => {
      const qty = Math.max(1, line.quantity ?? 1);
      const sizeId = line.sizeId ?? null;
      const sizeLabel = line.sizeLabel ?? line.size ?? null;
      const variantId = line.variantId ?? null;
      const lineId =
        line.lineId && line.lineId.length > 0
          ? line.lineId
          : makeCartLineId(line.productId, { sizeId, sizeLabel, variantId });
      setLines((prev) => {
        const i = prev.findIndex((l) => l.lineId === lineId);
        if (i >= 0) {
          const next = [...prev];
          next[i] = {
            ...next[i],
            quantity: next[i].quantity + qty,
          };
          return next;
        }
        return [
          ...prev,
          {
            lineId,
            productId: line.productId,
            slug: line.slug,
            name: line.name,
            priceCents: line.priceCents,
            currency: line.currency,
            imageUrl: line.imageUrl,
            sizeId,
            sizeLabel,
            size: sizeLabel,
            variantId,
            variantLabel: line.variantLabel ?? null,
            quantity: qty,
          },
        ];
      });
    },
    [],
  );

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    const q = Math.max(1, Math.floor(quantity));
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity: q } : l)),
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setAppliedCoupon(null);
  }, []);

  const applyCoupon = useCallback(
    async (rawCode: string): Promise<
      { ok: true } | { ok: false; error: string }
    > => {
      if (subtotalCents < 0) {
        return { ok: false, error: "Cart is empty." };
      }
      try {
        const res = await fetch("/api/shop/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: rawCode, subtotalCents }),
        });
        const data = (await res.json()) as {
          code?: string;
          discountCents?: number;
          error?: string;
        };
        if (!res.ok) {
          return { ok: false, error: data.error ?? "Invalid code." };
        }
        if (!data.code || typeof data.discountCents !== "number") {
          return { ok: false, error: "Invalid response." };
        }
        setAppliedCoupon({ code: data.code, discountCents: data.discountCents });
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Could not apply coupon. Try again.",
        };
      }
    },
    [subtotalCents],
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const { discountCents, totalCents } = useMemo(() => {
    const d = appliedCoupon?.discountCents ?? 0;
    const sub = subtotalCents;
    return {
      discountCents: d,
      totalCents: Math.max(0, sub - d),
    };
  }, [subtotalCents, appliedCoupon]);

  const value = useMemo(() => {
    const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
    return {
      lines,
      itemCount,
      subtotalCents,
      appliedCoupon,
      discountCents,
      totalCents,
      addLine,
      removeLine,
      setQuantity,
      clear,
      applyCoupon,
      removeCoupon,
      ready,
      couponRevalidating,
    };
  }, [
    lines,
    subtotalCents,
    appliedCoupon,
    discountCents,
    totalCents,
    addLine,
    removeLine,
    setQuantity,
    clear,
    applyCoupon,
    removeCoupon,
    ready,
    couponRevalidating,
  ]);

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
