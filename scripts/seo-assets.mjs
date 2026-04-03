/**
 * Genera `public/robots.txt` y `public/sitemap.xml` usando `VITE_SITE_URL` (sin barra final).
 * Sin URL: `robots.txt` mínimo sin línea Sitemap (Google Search Console puede añadir sitemap manualmente).
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

mkdirSync(publicDir, { recursive: true });

const envPath = join(root, ".env");
if (existsSync(envPath) && !process.env.VITE_SITE_URL) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key === "VITE_SITE_URL") {
      process.env.VITE_SITE_URL = val;
      break;
    }
  }
}

const base = (process.env.VITE_SITE_URL || "").trim().replace(/\/$/, "");

const robotsBase = `User-agent: *
Allow: /

Disallow: /admin/
`;

if (!base) {
  writeFileSync(join(publicDir, "robots.txt"), `${robotsBase}\n`);
  writeFileSync(
    join(publicDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
`,
  );
  console.warn(
    "[seo-assets] VITE_SITE_URL no definido: sitemap sin URLs. En producción definí VITE_SITE_URL en el build (Railway).",
  );
  process.exit(0);
}

const urls = [
  { loc: `${base}/`, changefreq: "weekly", priority: "1.0" },
  { loc: `${base}/propiedades`, changefreq: "daily", priority: "0.9" },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(join(publicDir, "robots.txt"), `${robotsBase}\nSitemap: ${base}/sitemap.xml\n`);
writeFileSync(join(publicDir, "sitemap.xml"), sitemap);
console.log(`[seo-assets] robots.txt + sitemap.xml → base ${base}`);
