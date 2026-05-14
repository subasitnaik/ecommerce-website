/** Persistent id for a courier preset (stored in ShopSettings JSON + Order.courierPresetId). */
export type CourierPreset = {
  id: string;
  name: string;
  /** Include exactly one `{{awb}}`; it will be replaced with encoded AWB (path-safe chars ok). */
  urlTemplate: string;
};

export const AWB_PLACEHOLDER = "{{awb}}";

export function parseCourierPresets(raw: unknown): CourierPreset[] {
  if (!Array.isArray(raw)) return [];
  const out: CourierPreset[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = typeof (row as { id?: unknown }).id === "string" ? (row as { id: string }).id.trim() : "";
    const name = typeof (row as { name?: unknown }).name === "string" ? (row as { name: string }).name.trim() : "";
    const urlTemplate =
      typeof (row as { urlTemplate?: unknown }).urlTemplate === "string"
        ? (row as { urlTemplate: string }).urlTemplate.trim()
        : "";
    if (!id || !name || !urlTemplate) continue;
    if (!urlTemplate.includes(AWB_PLACEHOLDER)) continue;
    out.push({ id, name, urlTemplate });
  }
  return out.slice(0, 12);
}

export function presetsById(raw: unknown): Map<string, CourierPreset> {
  const m = new Map<string, CourierPreset>();
  for (const p of parseCourierPresets(raw)) m.set(p.id, p);
  return m;
}

/** Build https URL opening in new tab — null if cannot resolve safely. */
export function resolveCourierTrackingUrl(
  presetList: CourierPreset[],
  courierPresetId: string | null | undefined,
  awbRaw: string | null | undefined,
): string | null {
  const awb = typeof awbRaw === "string" ? awbRaw.trim() : "";
  if (!awb || !courierPresetId) return null;
  const preset = presetList.find((p) => p.id === courierPresetId);
  if (!preset?.urlTemplate) return null;

  try {
    const replaced = preset.urlTemplate.split(AWB_PLACEHOLDER).join(encodeURIComponent(awb));
    const u = new URL(replaced);
    if (u.protocol === "https:") return u.toString();
    if (
      u.protocol === "http:" &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")
    ) {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function newCourierPresetId(): string {
  const uuid =
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 14)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `cr_${uuid}`;
}
