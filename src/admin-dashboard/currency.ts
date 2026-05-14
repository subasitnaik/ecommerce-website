/** Normalizes demo amounts and prefixes the Indian Rupee symbol. */
export function formatInrAmount(raw: string): string {
  const n = raw.replace(/^\s*[$₹]\s*/, "").trim();
  return `₹${n}`;
}
