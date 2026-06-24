/**
 * Smoke de producción: API + estáticos como en Docker (SERVE_STATIC=1).
 * Usa SQLite aislado; no toca lrv.db de desarrollo.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const distDir = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.join(repoRoot, "dist");

const tmpBase = mkdtempSync(path.join(tmpdir(), "lrv-prod-smoke-"));
process.env.DB_PATH = path.join(tmpBase, "test.db");
process.env.UPLOADS_DIR = path.join(tmpBase, "uploads");
delete process.env.DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || "prod-smoke-test-secret-min-32-chars";
process.env.NODE_ENV = "production";
process.env.TRUST_PROXY = "1";
process.env.SERVE_STATIC = "1";
process.env.FRONTEND_DIST = distDir;
process.env.CORS_ORIGINS = "https://www.ejemplo.com";
process.env.FRONTEND_URL = "https://www.ejemplo.com";

const ADMIN_EMAIL = "smoke-admin@lrv.test";
const ADMIN_PASSWORD = "SmokeTest_Admin_2026!";

let createApp;
let migrate;
let run;
let app;
let listingId;

test.before(async () => {
  ({ createApp } = await import("../app.js"));
  ({ migrate, run } = await import("../db.js"));
  await migrate();

  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  await run(
    "INSERT INTO users (email, hashed_password, role, email_verified) VALUES (?, ?, 'admin', 1) RETURNING id",
    ADMIN_EMAIL,
    hash,
  );

  const inserted = await run(
    `INSERT INTO listings (title, description, property_type, status, operation, city, province, price, currency, featured, images)
     VALUES (?, ?, 'casa', 'active', 'venta', ?, 'La Rioja', ?, 'ARS', 1, '[]') RETURNING id`,
    "Casa smoke test producción",
    "Propiedad de prueba para smoke de deploy.",
    "La Rioja Capital",
    1000000,
  );
  listingId = Number(inserted.lastInsertRowid);
  app = createApp();
});

test.after(() => {
  try {
    rmSync(tmpBase, { recursive: true, force: true });
  } catch {
    /* ponytail: temp dir best-effort */
  }
});

test("GET /api/health responde ok y uploads escribibles", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
  assert.equal(res.body.uploads_writable, true);
  assert.ok(res.body.timestamp);
});

test("GET /api/listings/public devuelve avisos activos", async () => {
  const res = await request(app).get("/api/listings/public");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.items));
  assert.ok(res.body.total >= 1);
  assert.equal(res.body.items.some((x) => x.id === listingId), true);
});

test("GET /api/listings/public/:id devuelve detalle público", async () => {
  const res = await request(app).get(`/api/listings/public/${listingId}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.id, listingId);
  assert.equal(res.body.title, "Casa smoke test producción");
});

test("POST /api/auth/login y GET /api/listings (admin)", async () => {
  const login = await request(app)
    .post("/api/auth/login")
    .send({ username: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  assert.equal(login.status, 200);
  assert.ok(login.body.access_token);

  const list = await request(app)
    .get("/api/listings")
    .set("Authorization", `Bearer ${login.body.access_token}`);
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body));
});

test("GET /api/listings/public/map devuelve puntos para el mapa", async () => {
  const res = await request(app).get("/api/listings/public/map");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.items));
});

test("SPA: GET / y /admin/login sirven index.html del build", async () => {
  const indexPath = path.join(distDir, "index.html");
  assert.ok(
    existsSync(indexPath),
    `Falta ${indexPath} — corré npm run build antes del smoke`,
  );

  for (const route of ["/", "/admin/login", "/propiedades"]) {
    const res = await request(app).get(route);
    assert.equal(res.status, 200, `${route} debe responder 200`);
    assert.match(res.headers["content-type"] || "", /html/i, `${route} debe ser HTML`);
    assert.match(res.text, /<div id="root"/i, `${route} debe ser la SPA`);
  }
});

test("assets inexistentes no devuelven index.html (evita MIME error post-deploy)", async () => {
  const res = await request(app).get("/assets/chunk-inexistente-00000000.js");
  assert.equal(res.status, 404);
  assert.doesNotMatch(res.headers["content-type"] || "", /html/i);
});

test("rutas /api/* inexistentes responden JSON 404", async () => {
  const res = await request(app).get("/api/ruta-que-no-existe");
  assert.equal(res.status, 404);
  assert.equal(typeof res.body.detail, "string");
});
