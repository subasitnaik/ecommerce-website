"use client";

import type { VaultOrderRef } from "@/lib/orders-vault";

export const SHOP_ORDERS_VAULT_KEY_V1 = "shopOrdersVault_v1";
export const LEGACY_SHOP_ORDER_TRACK_KEY = "shopOrderTrack";

type LegacyShape =
  | { email?: unknown; token?: unknown; orderNumber?: unknown }
  | null;

function safeParseLegacy(raw: string): LegacyShape {
  try {
    return JSON.parse(raw) as LegacyShape;
  } catch {
    return null;
  }
}

function isVaultOrderRef(x: unknown): x is VaultOrderRef {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.email === "string" &&
    typeof o.token === "string" &&
    typeof o.orderNumber === "number" &&
    typeof o.savedAt === "string"
  );
}

function persistVaultRefs(orders: VaultOrderRef[]) {
  sessionStorage.setItem(
    SHOP_ORDERS_VAULT_KEY_V1,
    JSON.stringify({ orders }),
  );
}

/** Read migrated vault refs. Call only in browser. */
export function readVaultOrderRefs(): VaultOrderRef[] {
  if (typeof window === "undefined") return [];

  try {
    const vaultRaw = sessionStorage.getItem(SHOP_ORDERS_VAULT_KEY_V1);
    if (vaultRaw) {
      const v = JSON.parse(vaultRaw) as { orders?: unknown };
      if (Array.isArray(v.orders))
        return v.orders.filter(isVaultOrderRef).slice(0, 99);
    }
  } catch {
    /* ignore */
  }

  const legacyRaw = sessionStorage.getItem(LEGACY_SHOP_ORDER_TRACK_KEY);
  if (legacyRaw) {
    const p = safeParseLegacy(legacyRaw);
    if (
      p &&
      typeof p.email === "string" &&
      typeof p.token === "string" &&
      typeof p.orderNumber === "number"
    ) {
      const migrated: VaultOrderRef = {
        email: p.email.trim().toLowerCase(),
        token: p.token.trim(),
        orderNumber: p.orderNumber,
        savedAt: new Date().toISOString(),
      };
      sessionStorage.removeItem(LEGACY_SHOP_ORDER_TRACK_KEY);
      persistVaultRefs([migrated]);
      return [migrated];
    }
  }

  return [];
}

/** Upsert vault then drop legacy blob — call after COD / Cashfree checkout. */
export function appendCheckoutToOrdersVault(payload: {
  email: string;
  token: string;
  orderNumber: number;
}): void {
  if (typeof window === "undefined") return;

  const email = payload.email.trim().toLowerCase();
  const token = payload.token.trim();
  const filtered = readVaultOrderRefs().filter((o) => o.token !== token);
  filtered.unshift({
    email,
    token,
    orderNumber: payload.orderNumber,
    savedAt: new Date().toISOString(),
  });
  persistVaultRefs(filtered.slice(0, 50));

  sessionStorage.removeItem(LEGACY_SHOP_ORDER_TRACK_KEY);
}

export function appendLookupToOrdersVault(
  email: string,
  token: string,
  orderNumber: number,
): void {
  appendCheckoutToOrdersVault({ email, token, orderNumber });
}
