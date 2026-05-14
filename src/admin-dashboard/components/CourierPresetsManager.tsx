"use client";

import { useEffect, useState } from "react";
import type { CourierPreset } from "@/lib/courier-presets";
import {
  AWB_PLACEHOLDER,
  newCourierPresetId,
  parseCourierPresets,
} from "@/lib/courier-presets";
import { HiOutlineTrash } from "react-icons/hi";

type Props = {
  initialPresets: CourierPreset[];
  onSaved: (next: CourierPreset[]) => void;
};

export default function CourierPresetsManager({
  initialPresets,
  onSaved,
}: Props) {
  const [rows, setRows] = useState<CourierPreset[]>(initialPresets);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(initialPresets);
  }, [initialPresets]);

  function addRow() {
    if (rows.length >= 12) return;
    setRows((prev) => [
      ...prev,
      {
        id: newCourierPresetId(),
        name: "",
        urlTemplate: `https://courier.example/track/${AWB_PLACEHOLDER}`,
      },
    ]);
  }

  async function persist(presetsToSave: CourierPreset[]) {
    for (const row of presetsToSave) {
      const n = row.name.trim();
      const u = row.urlTemplate.trim();
      if (!n || !u) {
        setSaveErr("Each courier needs a display name and a URL template.");
        return;
      }
      if (!u.includes(AWB_PLACEHOLDER)) {
        setSaveErr(
          `Courier “${n}”: URL template must contain ${AWB_PLACEHOLDER} for the AWB.`,
        );
        return;
      }
    }

    setSaving(true);
    setSaveErr(null);
    setSavedMsg(null);

    try {
      const payload = presetsToSave.map((p) => ({
        id: p.id.trim(),
        name: p.name.trim(),
        urlTemplate: p.urlTemplate.trim(),
      }));
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierPresets: payload }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        courierPresets?: unknown;
      };
      if (!res.ok) {
        window.alert(data.error ?? "Could not save couriers.");
        return;
      }
      const next = parseCourierPresets(data.courierPresets);
      setRows(next);
      onSaved(next);
      setSavedMsg("Couriers saved.");
      window.setTimeout(() => setSavedMsg(null), 2400);
    } finally {
      setSaving(false);
    }
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-4 rounded-lg border border-gray-600/50 bg-blackPrimary/[0.02] p-4 dark:border-gray-500/35 dark:bg-white/[0.03] sm:mx-6 lg:mx-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-blackPrimary dark:text-whiteSecondary">
            Couriers · tracking links
          </p>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-blackPrimary/70 dark:text-whiteSecondary/65">
            Add each courier once with a tracking URL template that contains{" "}
            <code className="rounded bg-blackPrimary/10 px-1 py-0.5 font-mono text-[10px] dark:bg-white/[0.08]">
              {AWB_PLACEHOLDER}
            </code>{" "}
            where the AWB should appear. On each shipped order you only enter
            the AWB and pick the courier.
          </p>
        </div>
        <button
          type="button"
          disabled={rows.length >= 12 || saving}
          onClick={addRow}
          className="shrink-0 rounded-lg border border-gray-600 px-3 py-2 text-xs font-semibold text-blackPrimary transition hover:bg-blackPrimary/[0.06] disabled:opacity-40 dark:border-gray-500 dark:text-whiteSecondary dark:hover:bg-white/[0.06]"
        >
          Add courier
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-blackPrimary/60 dark:text-whiteSecondary/55">
            No couriers yet. Add Bluedart, Delhivery, etc., then attach AWBs to
            orders from the dropdown on each row.
          </p>
        ) : null}
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-gray-600/35 bg-whiteSecondary/95 p-3 dark:border-gray-500/25 dark:bg-blackPrimary/65"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <label className="block min-w-0 flex-1 text-[11px] font-semibold text-neutral-500">
                Courier name
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, name: e.target.value } : r,
                      ),
                    )
                  }
                  maxLength={80}
                  className="mt-1 w-full rounded-lg border border-gray-600 bg-white px-2 py-2 text-sm outline-none dark:border-gray-500 dark:bg-blackPrimary dark:text-whiteSecondary"
                  placeholder="e.g. Blue Dart"
                />
              </label>
              <button
                type="button"
                aria-label={`Remove courier ${row.name || row.id}`}
                onClick={() => removeRow(row.id)}
                className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg border border-rose-500/40 text-rose-700 transition hover:bg-rose-500/10 dark:text-rose-300 sm:self-auto"
              >
                <HiOutlineTrash className="text-lg" />
              </button>
            </div>
            <label className="mt-3 block text-[11px] font-semibold text-neutral-500">
              Tracking URL template (must include{" "}
              <code className="font-mono">{AWB_PLACEHOLDER}</code>)
              <input
                type="text"
                value={row.urlTemplate}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.id === row.id
                        ? { ...r, urlTemplate: e.target.value }
                        : r,
                    ),
                  )
                }
                className="mt-1 w-full rounded-lg border border-gray-600 bg-white px-2 py-2 font-mono text-xs outline-none dark:border-gray-500 dark:bg-blackPrimary dark:text-whiteSecondary"
                placeholder={`https://…/${AWB_PLACEHOLDER}`}
                spellCheck={false}
              />
            </label>
          </div>
        ))}
      </div>

      {saveErr ? (
        <p className="mt-3 text-xs text-rose-600 dark:text-rose-300" role="alert">
          {saveErr}
        </p>
      ) : null}
      {savedMsg ? (
        <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">
          {savedMsg}
        </p>
      ) : null}

      <button
        type="button"
        disabled={saving}
        onClick={() => void persist(rows)}
        className="mt-4 w-full rounded-lg bg-blackPrimary py-2.5 text-sm font-semibold text-whiteSecondary transition hover:opacity-90 disabled:opacity-50 dark:bg-whiteSecondary dark:text-blackPrimary sm:w-auto sm:px-10"
      >
        {saving ? "Saving…" : "Save couriers"}
      </button>
    </div>
  );
}
