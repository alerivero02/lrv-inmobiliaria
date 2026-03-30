import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));

let cached;

/**
 * Directorio de archivos subidos.
 * `UPLOADS_DIR` (absoluta o relativa al cwd) sobreescribe el default `backend-node/uploads`.
 *
 * En Docker (Railway): `WORKDIR` es `/app/backend-node` → por defecto **`/app/backend-node/uploads`**.
 * Montá el volumen persistente de Railway en esa ruta (o en la ruta que definas en `UPLOADS_DIR`).
 */
export function getUploadsDir() {
  if (cached !== undefined) return cached;
  const env = process.env.UPLOADS_DIR?.trim();
  cached = env ? path.resolve(env) : path.join(backendRoot, "uploads");
  return cached;
}
