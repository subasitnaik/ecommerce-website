/** Accept https (and http only for localhost) for admin-pasted courier links. */
export function isAllowedTrackingUrl(raw: string): boolean {
  const s = raw.trim();
  try {
    const u = new URL(s);
    if (u.protocol === "https:") return true;
    if (u.protocol === "http:") {
      return u.hostname === "localhost" || u.hostname === "127.0.0.1";
    }
    return false;
  } catch {
    return false;
  }
}
