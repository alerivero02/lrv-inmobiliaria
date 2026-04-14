import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import multer from "multer";
import { get, all, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { isAllowedImageMime, optimizeImageToFile } from "../utils/images.js";
import { getUploadsDir } from "../uploadsDir.js";

const UPLOADS_DIR = getUploadsDir();

/** Rutas relativas evitan CSP (img-src 'self') al mezclar 127.0.0.1 / localhost / Vite :5173. */
function normalizeUploadUrl(url) {
  if (typeof url !== "string") return url;
  const m = url.match(/^https?:\/\/[^/]+(\/uploads\/[^?#]+)/i);
  return m ? m[1] : url;
}

// Multer
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedImageMime(file.mimetype)) {
      return cb(new Error("Solo se permiten imágenes JPG/PNG/WebP"));
    }
    return cb(null, true);
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJSON(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function parseListing(row) {
  if (!row) return null;
  const imgs = parseJSON(row.images, []);
  return {
    ...row,
    images: Array.isArray(imgs) ? imgs.map(normalizeUploadUrl) : imgs,
    has_garage: Boolean(row.has_garage),
    has_garden: Boolean(row.has_garden),
    has_pool: Boolean(row.has_pool),
    has_patio: Boolean(row.has_patio),
    has_balcony: Boolean(row.has_balcony),
    has_quincho: Boolean(row.has_quincho),
    has_terrace: Boolean(row.has_terrace),
    featured: Boolean(row.featured),
    garage_count: row.garage_count ?? null,
    covered_area_sqm: row.covered_area_sqm ?? null,
    price: row.price ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    rooms: row.rooms ?? null,
    commission_buyer: row.commission_buyer ?? 3.0,
    commission_seller: row.commission_seller ?? 3.0,
  };
}

// Mapa de ordenamiento seguro (evita SQL injection)
const ORDER_MAP = {
  views: "view_count DESC, updated_at DESC",
  consults: "consult_count DESC, updated_at DESC",
  destacadas: "featured DESC, (view_count + consult_count * 2) DESC, updated_at DESC",
  price_asc: "price ASC NULLS LAST",
  price_desc: "price DESC NULLS LAST",
  updated: "updated_at DESC",
};

async function ensureFeaturedLimit({ nextFeatured, currentFeatured = false, listingId = null }) {
  if (!nextFeatured || currentFeatured) return;
  const row = listingId
    ? await get("SELECT COUNT(*) AS n FROM listings WHERE featured = 1 AND id != ?", listingId)
    : await get("SELECT COUNT(*) AS n FROM listings WHERE featured = 1");
  const featuredCount = Number(row?.n ?? 0);
  if (featuredCount >= 5) {
    const err = new Error("Solo podés tener 5 anuncios destacados como máximo.");
    err.status = 422;
    throw err;
  }
}

const router = Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
// IMPORTANTE: rutas estáticas antes de /:id

router.get("/public", async (req, res) => {
  const {
    min_price,
    max_price,
    property_type,
    operation,
    city,
    bedrooms,
    order_by,
    limit = 20,
    page = 1,
  } = req.query;

  const conds = ["status = 'active'"];
  const params = [];

  if (min_price) {
    conds.push("price >= ?");
    params.push(Number(min_price));
  }
  if (max_price) {
    conds.push("price <= ?");
    params.push(Number(max_price));
  }
  if (property_type) {
    conds.push("property_type = ?");
    params.push(property_type);
  }
  if (operation) {
    conds.push("operation = ?");
    params.push(operation);
  }
  if (city) {
    conds.push("(LOWER(city) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?))");
    params.push(`%${city}%`, `%${city}%`);
  }
  if (bedrooms) {
    conds.push("rooms >= ?");
    params.push(Number(bedrooms));
  }
  if (req.query.min_area) {
    conds.push("area_sqm >= ?");
    params.push(Number(req.query.min_area));
  }
  if (req.query.has_garage) {
    conds.push("has_garage = 1");
  }
  if (req.query.has_garden) {
    conds.push("has_garden = 1");
  }
  if (req.query.has_pool) {
    conds.push("has_pool = 1");
  }
  if (req.query.search) {
    conds.push(
      "(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?))",
    );
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }

  const where = `WHERE ${conds.join(" AND ")}`;
  const orderSql = ORDER_MAP[order_by] || ORDER_MAP.updated;
  const limitN = Math.min(Number(limit) || 20, 100);
  const pageN = Math.max(Number(page) || 1, 1);
  const offset = (pageN - 1) * limitN;

  const totalRow = await get(`SELECT COUNT(*) AS n FROM listings ${where}`, ...params);
  const total = Number(totalRow?.n ?? 0);
  const rows = await all(
    `SELECT * FROM listings ${where} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    ...params,
    limitN,
    offset,
  );

  return res.json({
    items: rows.map(parseListing),
    total,
    page: pageN,
    pages: Math.ceil(total / limitN),
  });
});

router.get("/public/:id", async (req, res) => {
  const row = await get("SELECT * FROM listings WHERE id = ? AND status = 'active'", req.params.id);
  if (!row) return res.status(404).json({ detail: "Anuncio no encontrado" });
  await run("UPDATE listings SET view_count = view_count + 1 WHERE id = ?", req.params.id);
  return res.json(parseListing({ ...row, view_count: (row.view_count || 0) + 1 }));
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

router.post("/upload", verifyToken, upload.array("files"), async (req, res, next) => {
  if (!req.files?.length) return res.status(400).json({ detail: "Sin archivos" });
  try {
    const results = await Promise.all(
      req.files.map(async (f) => {
        const inputPath = f.path;
        const base = path.basename(f.filename, path.extname(f.filename));
        const { publicFilename } = await optimizeImageToFile(inputPath, UPLOADS_DIR, base);
        if (publicFilename !== f.filename) {
          await fs.unlink(inputPath).catch(() => {});
        }
        return `/uploads/${publicFilename}`;
      }),
    );
    return res.json(results);
  } catch (err) {
    return next(err);
  }
});

router.get("/", verifyToken, async (req, res) => {
  const { status, property_type, operation, city, search, order_by } = req.query;
  const conds = [];
  const params = [];

  if (status) {
    conds.push("status = ?");
    params.push(status);
  }
  if (property_type) {
    conds.push("property_type = ?");
    params.push(property_type);
  }
  if (operation) {
    conds.push("operation = ?");
    params.push(operation);
  }
  if (city) {
    conds.push("(LOWER(city) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?))");
    params.push(`%${city}%`, `%${city}%`);
  }
  if (search) {
    conds.push(
      "(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?))",
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const orderSql = ORDER_MAP[order_by] || ORDER_MAP.updated;

  const rows = await all(`SELECT * FROM listings ${where} ORDER BY ${orderSql}`, ...params);
  return res.json(rows.map(parseListing));
});

router.get("/:id", verifyToken, async (req, res) => {
  const row = await get("SELECT * FROM listings WHERE id = ?", req.params.id);
  if (!row) return res.status(404).json({ detail: "Anuncio no encontrado" });
  return res.json(parseListing(row));
});

router.post("/", verifyToken, async (req, res) => {
  const {
    title,
    description,
    property_type,
    status,
    operation,
    documentation,
    address,
    city,
    province,
    lat,
    lng,
    location_manual,
    rooms,
    area_sqm,
    price,
    currency,
    has_garage,
    has_garden,
    has_pool,
    has_patio,
    has_balcony,
    has_quincho,
    has_terrace,
    garage_count,
    covered_area_sqm,
    featured,
    extras_note,
    images,
    commission_buyer,
    commission_seller,
  } = req.body;

  if (!title) return res.status(422).json({ detail: "El título es obligatorio" });
  if (!province?.trim()) return res.status(422).json({ detail: "La provincia es obligatoria" });
  if (price == null || price === "") return res.status(422).json({ detail: "El precio es obligatorio" });
  if (!currency?.trim()) return res.status(422).json({ detail: "La moneda es obligatoria" });

  try {
    await ensureFeaturedLimit({ nextFeatured: Boolean(featured) });
  } catch (err) {
    return res.status(err.status || 500).json({ detail: err.message });
  }

  const { lastInsertRowid } = await run(
    `
    INSERT INTO listings
    (title,description,property_type,status,operation,documentation,
     address,city,province,lat,lng,location_manual,
     rooms,area_sqm,price,currency,
     has_garage,has_garden,has_pool,has_patio,has_balcony,has_quincho,has_terrace,garage_count,covered_area_sqm,featured,extras_note,images,
     commission_buyer,commission_seller)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    RETURNING id
  `,
    title,
    description ?? null,
    property_type ?? "casa",
    status ?? "active",
    operation ?? "venta",
    documentation ?? null,
    address ?? null,
    city ?? null,
    province.trim(),
    lat ?? null,
    lng ?? null,
    location_manual ?? null,
    rooms ?? null,
    area_sqm ?? 0,
    Number(price),
    currency.trim(),
    has_garage ? 1 : 0,
    has_garden ? 1 : 0,
    has_pool ? 1 : 0,
    has_patio ? 1 : 0,
    has_balcony ? 1 : 0,
    has_quincho ? 1 : 0,
    has_terrace ? 1 : 0,
    has_garage ? (garage_count == null || garage_count === "" ? null : Number(garage_count)) : null,
    covered_area_sqm == null || covered_area_sqm === "" ? null : Number(covered_area_sqm),
    featured ? 1 : 0,
    extras_note ?? null,
    JSON.stringify(Array.isArray(images) ? images : []),
    commission_buyer ?? 3.0,
    commission_seller ?? 3.0,
  );

  return res
    .status(201)
    .json(parseListing(await get("SELECT * FROM listings WHERE id = ?", lastInsertRowid)));
});

router.patch("/:id", verifyToken, async (req, res) => {
  const existing = await get("SELECT * FROM listings WHERE id = ?", req.params.id);
  if (!existing) return res.status(404).json({ detail: "Anuncio no encontrado" });

  const FIELDS = [
    "title",
    "description",
    "property_type",
    "status",
    "operation",
    "documentation",
    "address",
    "city",
    "province",
    "lat",
    "lng",
    "location_manual",
    "rooms",
    "area_sqm",
    "price",
    "currency",
    "has_garage",
    "has_garden",
    "has_pool",
    "has_patio",
    "has_balcony",
    "has_quincho",
    "has_terrace",
    "garage_count",
    "covered_area_sqm",
    "featured",
    "extras_note",
    "images",
    "commission_buyer",
    "commission_seller",
  ];
  const BOOL_FIELDS = new Set([
    "has_garage",
    "has_garden",
    "has_pool",
    "has_patio",
    "has_balcony",
    "has_quincho",
    "has_terrace",
    "featured",
  ]);

  const nextPrice = "price" in req.body ? req.body.price : existing.price;
  const nextCurrency = "currency" in req.body ? req.body.currency : existing.currency;
  const nextProvince = "province" in req.body ? req.body.province : existing.province;
  if (nextPrice == null || nextPrice === "") {
    return res.status(422).json({ detail: "El precio es obligatorio" });
  }
  if (!String(nextCurrency || "").trim()) {
    return res.status(422).json({ detail: "La moneda es obligatoria" });
  }
  if (!String(nextProvince || "").trim()) {
    return res.status(422).json({ detail: "La provincia es obligatoria" });
  }
  try {
    await ensureFeaturedLimit({
      nextFeatured: "featured" in req.body ? Boolean(req.body.featured) : Boolean(existing.featured),
      currentFeatured: Boolean(existing.featured),
      listingId: req.params.id,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ detail: err.message });
  }

  const sets = [];
  const vals = [];

  for (const f of FIELDS) {
    if (!(f in req.body)) continue;
    let v = req.body[f];
    if (f === "images") v = JSON.stringify(Array.isArray(v) ? v : []);
    if (f === "province" && typeof v === "string") v = v.trim();
    if (f === "currency" && typeof v === "string") v = v.trim();
    if (f === "price") v = Number(v);
    if (f === "covered_area_sqm") v = v == null || v === "" ? null : Number(v);
    if (f === "garage_count") v = v == null || v === "" ? null : Number(v);
    if (BOOL_FIELDS.has(f)) v = v ? 1 : 0;
    if (f === "garage_count" && !("has_garage" in req.body) && !existing.has_garage) v = null;
    if (f === "has_garage" && !v) {
      sets.push("garage_count = ?");
      vals.push(null);
    }
    sets.push(`${f} = ?`);
    vals.push(v);
  }

  if (!sets.length) return res.json(parseListing(existing));

  sets.push("updated_at = CURRENT_TIMESTAMP");
  vals.push(req.params.id);
  await run(`UPDATE listings SET ${sets.join(", ")} WHERE id = ?`, ...vals);
  return res.json(parseListing(await get("SELECT * FROM listings WHERE id = ?", req.params.id)));
});

router.delete("/:id", verifyToken, async (req, res) => {
  if (!(await get("SELECT id FROM listings WHERE id = ?", req.params.id))) {
    return res.status(404).json({ detail: "Anuncio no encontrado" });
  }
  await run("DELETE FROM listings WHERE id = ?", req.params.id);
  return res.status(204).send();
});

export default router;
