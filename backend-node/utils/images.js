import path from "node:path";
import sharp from "sharp";

export const IMAGE_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

export const IMAGE_UPLOAD_REJECT_MESSAGE =
  "Solo se permiten imágenes JPG, PNG, WebP, HEIC o GIF (máx. 15 MB cada una)";

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".gif",
]);

const GENERIC_MIMES = new Set(["", "application/octet-stream"]);

function extensionOf(filename) {
  return path.extname(filename || "").toLowerCase();
}

function getMaxWidth() {
  const raw = Number(process.env.IMAGE_MAX_WIDTH);
  return Number.isFinite(raw) && raw > 0 ? raw : 1920;
}

function getQuality() {
  const raw = Number(process.env.IMAGE_QUALITY);
  return Number.isFinite(raw) && raw >= 1 && raw <= 100 ? raw : 80;
}

function getFormat() {
  const fmt = String(process.env.IMAGE_FORMAT || "webp").toLowerCase();
  return fmt === "avif" ? "avif" : "webp";
}

/** @deprecated Usar isAllowedImageUpload para validar archivos multer */
export function isAllowedImageMime(mime) {
  return ALLOWED_MIMES.has((mime || "").toLowerCase());
}

/**
 * Valida un archivo de subida (MIME conocido o extensión permitida con MIME genérico).
 * @param {{ mimetype?: string, originalname?: string }} file
 */
export function isAllowedImageUpload(file) {
  const mime = (file.mimetype || "").toLowerCase();
  const ext = extensionOf(file.originalname);

  if (ALLOWED_MIMES.has(mime)) return true;
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (GENERIC_MIMES.has(mime)) return true;
  if (mime.startsWith("image/")) return true;
  return false;
}

export async function optimizeImageToFile(inputPath, outputDir, outputBaseNameNoExt) {
  const format = getFormat();
  const ext = format === "avif" ? ".avif" : ".webp";
  const outPath = path.join(outputDir, `${outputBaseNameNoExt}${ext}`);

  const maxWidth = getMaxWidth();
  const quality = getQuality();

  let pipeline = sharp(inputPath, { failOn: "none" })
    .rotate() // respeta EXIF orientation
    .resize({ width: maxWidth, withoutEnlargement: true })
    .withMetadata({ orientation: undefined }); // no mantener orientación; evita problemas

  pipeline =
    format === "avif"
      ? pipeline.avif({ quality, effort: 4 })
      : pipeline.webp({ quality });

  await pipeline.toFile(outPath);
  return { outPath, publicFilename: path.basename(outPath) };
}
