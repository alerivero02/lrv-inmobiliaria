import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import multer from "multer";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { isAllowedImageMime, optimizeImageToFile } from "../utils/images.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const HOST = process.env.HOST || "http://localhost:4000";

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
  return {
    ...row,
    images: parseJSON(row.images, []),
    has_garage: Boolean(row.has_garage),
    has_garden: Boolean(row.has_garden),
    has_pool: Boolean(row.has_pool),
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
  destacadas: "(view_count + consult_count * 2) DESC, updated_at DESC",
  price_asc: "price ASC",
  price_desc: "price DESC",
  updated: "updated_at DESC",
};

// Wrapper para .run() que devuelve lastInsertRowid como Number
function run(stmt, ...params) {
  const r = stmt.run(...params);
  return { changes: r.changes, lastInsertRowid: Number(r.lastInsertRowid) };
}

const router = Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
// IMPORTANTE: rutas estáticas antes de /:id

router.get("/public", (req, res) => {
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
    conds.push("(city LIKE ? OR address LIKE ?)");
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
    conds.push("(title LIKE ? OR description LIKE ? OR city LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }

  const where = `WHERE ${conds.join(" AND ")}`;
  const orderSql = ORDER_MAP[order_by] || ORDER_MAP.updated;
  const limitN = Math.min(Number(limit) || 20, 100);
  const pageN = Math.max(Number(page) || 1, 1);
  const offset = (pageN - 1) * limitN;

  const total = db.prepare(`SELECT COUNT(*) n FROM listings ${where}`).get(...params).n;
  const rows = db
    .prepare(`SELECT * FROM listings ${where} ORDER BY ${orderSql} LIMIT ? OFFSET ?`)
    .all(...params, limitN, offset);

  return res.json({
    items: rows.map(parseListing),
    total,
    page: pageN,
    pages: Math.ceil(total / limitN),
  });
});

router.get("/public/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM listings WHERE id = ? AND status = 'active'")
    .get(req.params.id);
  if (!row) return res.status(404).json({ detail: "Anuncio no encontrado" });
  db.prepare("UPDATE listings SET view_count = view_count + 1 WHERE id = ?").run(req.params.id);
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
        // Borrar original (JPG/PNG) para ahorrar disco; el optimizado queda
        if (publicFilename !== f.filename) {
          await fs.unlink(inputPath).catch(() => {});
        }
        return `${HOST}/uploads/${publicFilename}`;
      }),
    );
    return res.json(results);
  } catch (err) {
    return next(err);
  }
});

router.get("/", verifyToken, (req, res) => {
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
    conds.push("(city LIKE ? OR address LIKE ?)");
    params.push(`%${city}%`, `%${city}%`);
  }
  if (search) {
    conds.push("(title LIKE ? OR description LIKE ? OR city LIKE ? OR address LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const orderSql = ORDER_MAP[order_by] || ORDER_MAP.updated;

  return res.json(
    db
      .prepare(`SELECT * FROM listings ${where} ORDER BY ${orderSql}`)
      .all(...params)
      .map(parseListing),
  );
});

router.get("/:id", verifyToken, (req, res) => {
  const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ detail: "Anuncio no encontrado" });
  return res.json(parseListing(row));
});

router.post("/", verifyToken, (req, res) => {
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
    extras_note,
    images,
    commission_buyer,
    commission_seller,
  } = req.body;

  if (!title) return res.status(422).json({ detail: "El título es obligatorio" });

  const stmt = db.prepare(`
    INSERT INTO listings
    (title,description,property_type,status,operation,documentation,
     address,city,province,lat,lng,location_manual,
     rooms,area_sqm,price,currency,
     has_garage,has_garden,has_pool,extras_note,images,
     commission_buyer,commission_seller)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const { lastInsertRowid } = run(
    stmt,
    title,
    description ?? null,
    property_type ?? "casa",
    status ?? "active",
    operation ?? "venta",
    documentation ?? null,
    address ?? null,
    city ?? null,
    province ?? "La Rioja",
    lat ?? null,
    lng ?? null,
    location_manual ?? null,
    rooms ?? null,
    area_sqm ?? 0,
    price ?? null,
    currency ?? "ARS",
    has_garage ? 1 : 0,
    has_garden ? 1 : 0,
    has_pool ? 1 : 0,
    extras_note ?? null,
    JSON.stringify(Array.isArray(images) ? images : []),
    commission_buyer ?? 3.0,
    commission_seller ?? 3.0,
  );

  return res
    .status(201)
    .json(parseListing(db.prepare("SELECT * FROM listings WHERE id = ?").get(lastInsertRowid)));
});

router.patch("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
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
    "extras_note",
    "images",
    "commission_buyer",
    "commission_seller",
  ];
  const BOOL_FIELDS = new Set(["has_garage", "has_garden", "has_pool"]);

  const sets = [];
  const vals = [];

  for (const f of FIELDS) {
    if (!(f in req.body)) continue;
    let v = req.body[f];
    if (f === "images") v = JSON.stringify(Array.isArray(v) ? v : []);
    if (BOOL_FIELDS.has(f)) v = v ? 1 : 0;
    sets.push(`${f} = ?`);
    vals.push(v);
  }

  if (!sets.length) return res.json(parseListing(existing));

  sets.push("updated_at = datetime('now')");
  vals.push(req.params.id);
  db.prepare(`UPDATE listings SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return res.json(
    parseListing(db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id)),
  );
});

router.delete("/:id", verifyToken, (req, res) => {
  if (!db.prepare("SELECT id FROM listings WHERE id = ?").get(req.params.id)) {
    return res.status(404).json({ detail: "Anuncio no encontrado" });
  }
  db.prepare("DELETE FROM listings WHERE id = ?").run(req.params.id);
  return res.status(204).send();
});

export default router;
