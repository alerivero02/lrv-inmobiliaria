/** Número para wa.me: código país + código área + número, sin + ni espacios. */
export const AGENCY_WHATSAPP = import.meta.env.VITE_AGENCY_WHATSAPP || "5493804545701";

/**
 * Base pública del sitio para armar enlaces (p. ej. WhatsApp).
 * En el navegador usa siempre el origen actual; fuera de él, VITE_SITE_URL.
 */
export function getSiteBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  const fromEnv = String(import.meta.env.VITE_SITE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "";
}
