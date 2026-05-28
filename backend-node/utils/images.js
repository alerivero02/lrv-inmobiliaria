import fs from "node:fs/promises";
import path from "node:path";
import convert from "heic-convert";
import sharp from "sharp";

export const IMAGE_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

export const IMAGE_UPLOAD_REJECT_MESSAGE =
  "Solo se permiten imágenes JPG, PNG, WebP, AVIF, HEIC, HEIF o GIF (máx. 15 MB cada una)";

export const IMAGE_HEIC_PROCESS_ERROR = "No se pudo procesar la foto HEIC/HEIF";

const HEIC_EXTENSIONS = new Set([".heic", ".heif", ".hif"]);

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".jfif",
  ".png",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
  ".hif",
  ".gif",
]);

const BLOCKED_MIMES = new Set(["image/heic-sequence", "image/heif-sequence"]);

const BLOCKED_EXTENSIONS = new Set([".mov", ".mp4", ".m4v"]);

const GENERIC_MIMES = new Set(["", "application/octet-stream"]);

function extensionOf(filename) {
  return path.extname(filename || "").toLowerCase();
}

function isBlockedUpload(file) {
  const mime = (file.mimetype || "").toLowerCase();
  const ext = extensionOf(file.originalname);

  if (mime.startsWith("video/")) return true;
  if (BLOCKED_MIMES.has(mime)) return true;
  if (BLOCKED_EXTENSIONS.has(ext)) return true;
  return false;
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
  if (isBlockedUpload(file)) return false;

  const mime = (file.mimetype || "").toLowerCase();
  const ext = extensionOf(file.originalname);

  if (ALLOWED_MIMES.has(mime)) return true;
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (GENERIC_MIMES.has(mime)) return true;
  if (mime.startsWith("image/")) return true;
  return false;
}

async function loadSharpPipeline(inputPath) {
  const ext = extensionOf(inputPath);

  if (HEIC_EXTENSIONS.has(ext)) {
    const inputBuffer = await fs.readFile(inputPath);
    try {
      const jpegBuffer = await convert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 0.92,
      });
      return sharp(Buffer.from(jpegBuffer), { failOn: "none" });
    } catch {
      throw new Error(IMAGE_HEIC_PROCESS_ERROR);
    }
  }

  return sharp(inputPath, { failOn: "none" });
}

export async function optimizeImageToFile(inputPath, outputDir, outputBaseNameNoExt) {
  const format = getFormat();
  const outExt = format === "avif" ? ".avif" : ".webp";
  const outPath = path.join(outputDir, `${outputBaseNameNoExt}${outExt}`);

  const maxWidth = getMaxWidth();
  const quality = getQuality();

  let pipeline = (await loadSharpPipeline(inputPath))
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .withMetadata({ orientation: undefined });

  pipeline =
    format === "avif"
      ? pipeline.avif({ quality, effort: 4 })
      : pipeline.webp({ quality });

  await pipeline.toFile(outPath);
  return { outPath, publicFilename: path.basename(outPath) };
}
