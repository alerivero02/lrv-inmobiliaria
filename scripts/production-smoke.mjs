#!/usr/bin/env node
/**
 * Smoke pre-producción: build Vite + chequeos de artefactos + tests API/SPA.
 * Simula el contenedor Docker (SERVE_STATIC=1, NODE_ENV=production).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const backend = path.join(root, "backend-node");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`\n❌  ${msg}\n`);
    process.exit(1);
  }
}

console.log("\n── 1/3  Build de producción (Vite + SEO) ──\n");
run("npm", ["run", "build"], {
  cwd: root,
  env: {
    ...process.env,
    VITE_API_URL: "/api",
    VITE_SITE_URL: process.env.VITE_SITE_URL || "https://www.ejemplo.com",
  },
});

console.log("\n── 2/3  Artefactos del build ──\n");
assert(existsSync(path.join(dist, "index.html")), "dist/index.html no existe");
const assetsDir = path.join(dist, "assets");
assert(existsSync(assetsDir), "dist/assets no existe");
const hasJsBundle = readdirSync(assetsDir).some((f) => f.endsWith(".js"));
assert(hasJsBundle, "No hay bundles JS en dist/assets");

const indexHtml = readFileSync(path.join(dist, "index.html"), "utf8");
assert(indexHtml.includes('id="root"'), "index.html sin #root");

assert(existsSync(path.join(dist, "robots.txt")), "dist/robots.txt no existe (seo-assets)");
assert(existsSync(path.join(dist, "sitemap.xml")), "dist/sitemap.xml no existe (seo-assets)");
const sitemap = readFileSync(path.join(dist, "sitemap.xml"), "utf8");
assert(sitemap.includes("<urlset"), "sitemap.xml inválido");

console.log("\n── 3/3  API + SPA (modo Docker) ──\n");
run("npm", ["run", "test:production"], {
  cwd: backend,
  env: {
    ...process.env,
    FRONTEND_DIST: dist,
    JWT_SECRET: process.env.JWT_SECRET || "prod-smoke-test-secret-min-32-chars",
  },
});

console.log("\n✅  Smoke de producción OK");
console.log("   Antes de deploy en Railway verificá también:");
console.log("   · DATABASE_URL referenciado desde Postgres");
console.log("   · JWT_SECRET, FRONTEND_URL, TRUST_PROXY=1");
console.log("   · Volumen en /app/backend-node/uploads");
console.log("   · VITE_SITE_URL y VITE_GOOGLE_MAPS_API_KEY en build\n");
