/** Título por defecto (alineado con `index.html`). */
export const DEFAULT_DOCUMENT_TITLE = "LRV Inmobiliaria | La Rioja, Argentina";

/** Descripción por defecto: incluye marca “LRV” / “LRV Inmobiliaria” para búsquedas. */
export const DEFAULT_META_DESCRIPTION =
  "LRV Inmobiliaria — venta y alquiler de casas, departamentos, terrenos, fincas y campos en La Rioja, Argentina. Inmobiliaria LRV: propiedades en venta y alquiler. Desde 2015.";

export const DEFAULT_OG_IMAGE_PATH = "/lrv-asociados.webp";

/**
 * URL pública del sitio (build: `VITE_SITE_URL`; en cliente sin env, `window.location.origin`).
 */
export function getSiteUrl() {
  const v = import.meta.env.VITE_SITE_URL;
  if (typeof v === "string" && v.trim()) return v.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
}

/**
 * Convierte ruta relativa (`/uploads/...`) o absoluta en URL absoluta para Open Graph.
 */
export function toAbsoluteUrl(assetPath) {
  if (!assetPath || typeof assetPath !== "string") return "";
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const base = getSiteUrl();
  if (!base) return assetPath;
  const path = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${base}${path}`;
}

/** Meta tags para ficha de propiedad (OG con imagen absoluta). Solo en cliente. */
export function applyListingSeo(listing) {
  if (!listing || typeof document === "undefined") return;
  const desc = (listing.description || listing.title || "").slice(0, 160);
  const titleText = `${listing.title} | LRV Inmobiliaria`;
  document.title = titleText;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", desc);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", listing.title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", desc);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const img = listing.images?.[0];
    ogImage.setAttribute(
      "content",
      img ? toAbsoluteUrl(img) : toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
    );
  }

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl && typeof window !== "undefined") {
    ogUrl.setAttribute("content", window.location.href);
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && typeof window !== "undefined") {
    canonical.setAttribute("href", window.location.href);
  }
}

/** Revierte meta de ficha al salir (vuelve a defaults de la home). */
export function resetListingSeo() {
  if (typeof document === "undefined") return;
  document.title = DEFAULT_DOCUMENT_TITLE;
  const site = getSiteUrl();
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", DEFAULT_META_DESCRIPTION);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", DEFAULT_DOCUMENT_TITLE);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc)
    ogDesc.setAttribute(
      "content",
      "LRV Inmobiliaria — venta y alquiler de casas, departamentos, terrenos, fincas y campos en La Rioja, Argentina.",
    );
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute("content", toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH));
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl && site) ogUrl.setAttribute("content", `${site}/`);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && site) canonical.setAttribute("href", `${site}/`);
}
