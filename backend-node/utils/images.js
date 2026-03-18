import path from "node:path";
import sharp from "sharp";

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

export function isAllowedImageMime(mime) {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
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

