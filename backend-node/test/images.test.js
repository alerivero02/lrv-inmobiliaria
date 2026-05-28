import test from "node:test";
import assert from "node:assert/strict";
import {
  IMAGE_UPLOAD_REJECT_MESSAGE,
  isAllowedImageMime,
  isAllowedImageUpload,
} from "../utils/images.js";

test("isAllowedImageMime acepta variantes JPEG/PNG/WebP/AVIF", () => {
  assert.equal(isAllowedImageMime("image/jpeg"), true);
  assert.equal(isAllowedImageMime("image/jpg"), true);
  assert.equal(isAllowedImageMime("image/pjpeg"), true);
  assert.equal(isAllowedImageMime("image/jfif"), true);
  assert.equal(isAllowedImageMime("image/png"), true);
  assert.equal(isAllowedImageMime("image/x-png"), true);
  assert.equal(isAllowedImageMime("image/webp"), true);
  assert.equal(isAllowedImageMime("image/avif"), true);
  assert.equal(isAllowedImageMime("image/heic"), true);
  assert.equal(isAllowedImageMime("application/pdf"), false);
});

test("isAllowedImageUpload acepta HEIC, AVIF, JFIF y GIF por MIME", () => {
  assert.equal(isAllowedImageUpload({ mimetype: "image/heic", originalname: "foto.heic" }), true);
  assert.equal(isAllowedImageUpload({ mimetype: "image/heif", originalname: "foto.heif" }), true);
  assert.equal(isAllowedImageUpload({ mimetype: "image/avif", originalname: "foto.avif" }), true);
  assert.equal(isAllowedImageUpload({ mimetype: "image/jfif", originalname: "foto.jfif" }), true);
  assert.equal(isAllowedImageUpload({ mimetype: "image/gif", originalname: "anim.gif" }), true);
});

test("isAllowedImageUpload acepta HIF con application/octet-stream", () => {
  assert.equal(
    isAllowedImageUpload({ mimetype: "application/octet-stream", originalname: "foto.hif" }),
    true,
  );
});

test("isAllowedImageUpload acepta JPG con application/octet-stream", () => {
  assert.equal(
    isAllowedImageUpload({ mimetype: "application/octet-stream", originalname: "foto.jpg" }),
    true,
  );
  assert.equal(isAllowedImageUpload({ mimetype: "", originalname: "foto.jpeg" }), true);
});

test("isAllowedImageUpload rechaza PDF aunque la extensión sea .jpg", () => {
  assert.equal(
    isAllowedImageUpload({ mimetype: "application/pdf", originalname: "malicioso.jpg" }),
    false,
  );
  assert.equal(isAllowedImageUpload({ mimetype: "application/pdf", originalname: "doc.pdf" }), false);
});

test("isAllowedImageUpload rechaza video y secuencias HEIF", () => {
  assert.equal(
    isAllowedImageUpload({ mimetype: "video/mp4", originalname: "clip.mp4" }),
    false,
  );
  assert.equal(isAllowedImageUpload({ mimetype: "video/quicktime", originalname: "live.mov" }), false);
  assert.equal(
    isAllowedImageUpload({ mimetype: "image/heic-sequence", originalname: "live.heic" }),
    false,
  );
  assert.equal(
    isAllowedImageUpload({ mimetype: "image/heif-sequence", originalname: "live.heif" }),
    false,
  );
});

test("mensaje de rechazo documenta formatos soportados", () => {
  assert.match(IMAGE_UPLOAD_REJECT_MESSAGE, /JPG/i);
  assert.match(IMAGE_UPLOAD_REJECT_MESSAGE, /HEIC/i);
  assert.match(IMAGE_UPLOAD_REJECT_MESSAGE, /AVIF/i);
});
