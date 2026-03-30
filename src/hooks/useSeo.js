import { useEffect } from "react";
import { DEFAULT_DOCUMENT_TITLE, DEFAULT_META_DESCRIPTION, getSiteUrl } from "../utils/seo";

/**
 * Actualiza `<title>`, meta description, canonical y Open Graph en rutas públicas.
 * En admin/login, usar `noIndex: true`.
 *
 * @param {object} [opts]
 * @param {string} [opts.title] — fragmento antes de " | LRV Inmobiliaria", o título completo si `fullTitle` es true
 * @param {boolean} [opts.fullTitle] — si true, `title` es el document.title completo
 * @param {string} [opts.description]
 * @param {string} [opts.canonicalPath] — solo path, p. ej. `/propiedades`
 * @param {boolean} [opts.noIndex]
 */
export function useSeo(opts = {}) {
  const {
    title,
    fullTitle = false,
    description = DEFAULT_META_DESCRIPTION,
    canonicalPath,
    noIndex = false,
  } = opts;

  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") ?? "";

    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? "";

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const prevOgTitle = ogTitle?.getAttribute("content") ?? "";

    const ogDesc = document.querySelector('meta[property="og:description"]');
    const prevOgDesc = ogDesc?.getAttribute("content") ?? "";

    const ogUrl = document.querySelector('meta[property="og:url"]');
    const prevOgUrl = ogUrl?.getAttribute("content") ?? "";

    let robots = document.querySelector('meta[name="robots"]');
    const prevRobots = robots?.getAttribute("content") ?? "";

    const nextTitle = fullTitle
      ? title || DEFAULT_DOCUMENT_TITLE
      : title
        ? `${title} | LRV Inmobiliaria`
        : DEFAULT_DOCUMENT_TITLE;

    document.title = nextTitle;

    if (metaDesc) metaDesc.setAttribute("content", description);

    const site = getSiteUrl();
    const path =
      canonicalPath !== undefined
        ? canonicalPath.startsWith("/")
          ? canonicalPath
          : `/${canonicalPath}`
        : typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search || ""}`
          : "/";

    if (canonical && site) {
      const href = `${site}${path === "" ? "/" : path}`;
      canonical.setAttribute("href", href);
    }

    if (ogTitle) ogTitle.setAttribute("content", nextTitle);
    if (ogDesc) ogDesc.setAttribute("content", description);
    if (ogUrl && site) {
      const url = `${site}${path === "" ? "/" : path}`;
      ogUrl.setAttribute("content", url);
    }

    if (noIndex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute("content", prevDesc);
      if (canonical && prevCanonical) canonical.setAttribute("href", prevCanonical);
      if (ogTitle && prevOgTitle) ogTitle.setAttribute("content", prevOgTitle);
      if (ogDesc && prevOgDesc) ogDesc.setAttribute("content", prevOgDesc);
      if (ogUrl && prevOgUrl) ogUrl.setAttribute("content", prevOgUrl);
      if (robots) {
        if (prevRobots) robots.setAttribute("content", prevRobots);
        else if (noIndex) robots.setAttribute("content", "index, follow");
      }
    };
  }, [title, fullTitle, description, canonicalPath, noIndex]);
}
