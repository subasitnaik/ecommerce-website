"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";
import { COUPON_TYPE_FIXED, COUPON_TYPE_PERCENT } from "@/lib/coupon-constants";

type Row = {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  minSubtotalCents: number | null;
  expiresAt: string | null;
  createdAt: string;
};

function formatValue(row: Row): string {
  if (row.type === COUPON_TYPE_PERCENT) {
    return `${row.value}%`;
  }
  return formatMoney(row.value, "INR");
}

export function CouponsSection() {
  const [list, setList] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<typeof COUPON_TYPE_PERCENT | typeof COUPON_TYPE_FIXED>(
    COUPON_TYPE_PERCENT,
  );
  const [code, setCode] = useState("");
  const [valuePercent, setValuePercent] = useState(10);
  const [valueRupees, setValueRupees] = useState("50");
  const [minRupees, setMinRupees] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/coupons", { method: "GET" });
      const data = (await res.json()) as { coupons?: Row[]; error?: string };
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load coupons.");
        setList([]);
        return;
      }
      setList(data.coupons ?? []);
    } catch {
      setLoadError("Could not load coupons.");
      setList([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setFormError("Enter a coupon code.");
      setSaving(false);
      return;
    }

    let value: number;
    if (type === COUPON_TYPE_PERCENT) {
      value = Math.min(100, Math.max(1, Math.floor(valuePercent)));
    } else {
      const n = parseFloat(valueRupees.replace(/,/g, ""));
      if (Number.isNaN(n) || n <= 0) {
        setFormError("Enter a valid amount in rupees.");
        setSaving(false);
        return;
      }
      value = Math.round(n * 100);
    }

    let minCents: number | null = null;
    if (minRupees.trim() !== "") {
      const p = parseFloat(minRupees.replace(/,/g, ""));
      if (Number.isNaN(p) || p < 0) {
        setFormError("Invalid minimum order amount.");
        setSaving(false);
        return;
      }
      minCents = Math.round(p * 100);
    }

    let expires: string | null = null;
    if (expiresAt.trim() !== "") {
      const d = new Date(expiresAt);
      if (Number.isNaN(d.getTime())) {
        setFormError("Invalid expiry date.");
        setSaving(false);
        return;
      }
      expires = d.toISOString();
    }

    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: normalized,
        type,
        value,
        minSubtotalCents: minCents,
        expiresAt: expires,
        active: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
    if (!res.ok) {
      setFormError(data.error ?? "Could not create coupon.");
      setSaving(false);
      return;
    }
    setCode("");
    setValuePercent(10);
    setValueRupees("50");
    setMinRupees("");
    setExpiresAt("");
    setSaving(false);
    await load();
  }

  async function toggleActive(row: Row) {
    const res = await fetch(`/api/admin/coupons/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    if (res.ok) void load();
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete coupon ${row.code}?`)) return;
    const res = await fetch(`/api/admin/coupons/${row.id}`, { method: "DELETE" });
    if (res.ok) void load();
  }

  return (
    <div className="min-w-0 space-y-8 sm:space-y-12">
      <p className="max-w-2xl text-sm text-blackPrimary/80 dark:text-whiteSecondary/80">
        Customers enter these codes on the bag page at checkout. Fixed amounts are
        in rupees (stored as paisa in the database).
      </p>

      {loadError ? (
        <p className="text-sm text-amber-600 dark:text-amber-400/90">{loadError}</p>
      ) : null}

      {/* Section 1 — create */}
      <section
        aria-labelledby="discount-coupons-create"
        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm sm:p-6 dark:border-zinc-700/80"
      >
        <div className="border-b border-zinc-800 pb-4 dark:border-zinc-700">
          <h2
            id="discount-coupons-create"
            className="text-xl font-bold text-zinc-100"
          >
            Create a discount code
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Add a new percent-off or fixed-amount coupon. Codes are not
            case-sensitive for shoppers.
          </p>
        </div>

        <form onSubmit={onCreate} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs text-zinc-500">Code (letters &amp; numbers)</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100"
                placeholder="SAVE20"
              />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-xs text-zinc-500">Type</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="radio"
                    name="coupontype"
                    checked={type === COUPON_TYPE_PERCENT}
                    onChange={() => setType(COUPON_TYPE_PERCENT)}
                  />
                  Percent off
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="radio"
                    name="coupontype"
                    checked={type === COUPON_TYPE_FIXED}
                    onChange={() => setType(COUPON_TYPE_FIXED)}
                  />
                  Fixed amount (₹)
                </label>
              </div>
            </fieldset>
            {type === COUPON_TYPE_PERCENT ? (
              <label>
                <span className="text-xs text-zinc-500">Percent (1–100)</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={valuePercent}
                  onChange={(e) => setValuePercent(parseInt(e.target.value, 10) || 1)}
                  className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
            ) : (
              <label>
                <span className="text-xs text-zinc-500">Amount (₹)</span>
                <input
                  type="text"
                  value={valueRupees}
                  onChange={(e) => setValueRupees(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  placeholder="100"
                />
              </label>
            )}
            <label>
              <span className="text-xs text-zinc-500">Minimum order (₹, optional)</span>
              <input
                type="text"
                value={minRupees}
                onChange={(e) => setMinRupees(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                placeholder="0"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-zinc-500">Expires (local, optional)</span>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
          </div>
          {formError ? (
            <p className="text-sm text-red-400">{formError}</p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create coupon"}
          </button>
        </form>
      </section>

      {/* Section 2 — list */}
      <section
        aria-labelledby="discount-coupons-list"
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm sm:p-6 dark:border-zinc-700/80"
      >
        <div className="border-b border-zinc-800 pb-4 dark:border-zinc-700">
          <h2 id="discount-coupons-list" className="text-xl font-bold text-zinc-100">
            All discount codes
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Turn codes on or off anytime. Deleting a code cannot be undone.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800/80">
          <table className="w-full min-w-[640px] text-left text-sm text-zinc-200">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Min. order</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {list === null ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No coupons yet. Create one in the section above.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800/80 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs font-semibold tracking-wide">
                      {row.code}
                    </td>
                    <td className="px-4 py-3">{formatValue(row)}</td>
                    <td className="px-4 py-3">
                      {row.minSubtotalCents != null
                        ? formatMoney(row.minSubtotalCents, "INR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {row.expiresAt
                        ? new Date(row.expiresAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(row)}
                        className={
                          row.active
                            ? "text-teal-400 hover:underline"
                            : "text-zinc-500 hover:underline"
                        }
                      >
                        {row.active ? "On" : "Off"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void remove(row)}
                        className="text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
