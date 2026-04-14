import { lazy } from "react";

const CHUNK_RELOAD_KEY = "lrv_chunk_reload_count";

function isLikelyChunkLoadFailure(err) {
  const msg = String(err?.message ?? err ?? "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk \d+ failed|error loading dynamically imported module/i.test(
    msg,
  );
}

/**
 * Igual que `lazy()` pero tras un deploy, si falla la carga del chunk (404 / MIME),
 * fuerza una recarga del documento una vez para alinear HTML + assets.
 */
export function lazyWithRetry(importer, maxReloadAttempts = 1) {
  return lazy(async () => {
    try {
      const mod = await importer();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return mod;
    } catch (err) {
      if (typeof window === "undefined" || !isLikelyChunkLoadFailure(err)) {
        throw err;
      }
      const prev = Number.parseInt(sessionStorage.getItem(CHUNK_RELOAD_KEY) || "0", 10);
      if (prev < maxReloadAttempts) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(prev + 1));
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      throw err;
    }
  });
}
