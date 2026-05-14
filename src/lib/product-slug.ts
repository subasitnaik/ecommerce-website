/**
 * URL-safe product slug from a display name. Does not ensure uniqueness;
 * the API may append a suffix if the slug already exists.
 */
export function slugFromProductName(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return s || "product";
}
