import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import multer from "multer";
import { get, all, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import {
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_REJECT_MESSAGE,
  isAllowedImageUpload,
  optimizeImageToFile,
} from "../utils/images.js";
import { getUploadsDir } from "../uploadsDir.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { isLandPropertyType, normalizePropertyType } from "../constants/propertyTypes.js";
import {
  computePolygonAreaSqm,
  normalizeLotPolygon,
  polygonCentroid,
} from "../utils/geo.js";
import {
  getProvinceName,
  isValidProvinceCode,
  resolveProvinceCode,
} from "../constants/provinces.js";
import { MAX_FEATURED_LISTINGS } from "../constants/featured.js";
import {
  applyPolygonFilter,
  buildPublicListingWhere,
  paginateArray,
} from "../utils/listingFilters.js";

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
  limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedImageUpload(file)) {
      return cb(new Error(IMAGE_UPLOAD_REJECT_MESSAGE));
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
  const lotPolygon = normalizeLotPolygon(row.lot_polygon);
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
    lot_polygon: lotPolygon,
    price: row.price ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    province_code: row.province_code ?? null,
    rooms: row.rooms ?? null,
    commission_buyer: row.commission_buyer ?? 3.0,
    commission_seller: row.commission_seller ?? 3.0,
  };
}

/** Serializa un anuncio para respuestas públicas, omitiendo datos del referente (solo admin). */
function parsePublicListing(row) {
  const parsed = parseListing(row);
  if (!parsed) return null;
  const { referrer_name, referrer_lastname, referrer_phone, ...publicListing } = parsed;
  return publicListing;
}

/**
 * Valida y normaliza lot_polygon para tipos land; recalcula area_sqm y centroide si aplica.
 * @returns {{ lot_polygon: string|null, lat, lng, area_sqm, error?: string }}
 */
function resolveLotPolygonFields({ propertyType, lot_polygon, lat, lng, area_sqm }) {
  const isLand = isLandPropertyType(propertyType);
  if (!isLand) {
    return { lot_polygon: null, lat: lat ?? null, lng: lng ?? null, area_sqm: area_sqm ?? 0 };
  }

  if (lot_polygon == null || lot_polygon === "") {
    return { lot_polygon: null, lat: lat ?? null, lng: lng ?? null, area_sqm: area_sqm ?? 0 };
  }

  const ring = normalizeLotPolygon(lot_polygon);
  if (!ring) {
    return { error: "El perímetro del lote no es válido (mínimo 3 vértices)." };
  }

  const centroid = polygonCentroid(ring);
  const computedArea = Math.round(computePolygonAreaSqm(ring) * 100) / 100;
  const nextLat =
    lat != null && lat !== "" && !Number.isNaN(Number(lat)) ? Number(lat) : centroid?.lat ?? null;
  const nextLng =
    lng != null && lng !== "" && !Number.isNaN(Number(lng)) ? Number(lng) : centroid?.lng ?? null;

  return {
    lot_polygon: JSON.stringify(ring),
    lat: nextLat,
    lng: nextLng,
    area_sqm: computedArea,
  };
}

function parseMapListing(row) {
  const imgs = parseJSON(row.images, []);
  const firstImage = Array.isArray(imgs) && imgs.length ? normalizeUploadUrl(imgs[0]) : null;
  return {
    id: row.id,
    title: row.title,
    lat: row.lat,
    lng: row.lng,
    price: row.price,
    currency: row.currency,
    rooms: row.rooms,
    area_sqm: row.area_sqm,
    property_type: row.property_type,
    operation: row.operation,
    city: row.city,
    image: firstImage,
  };
}

async function ensureFeaturedLimit({ nextFeatured, currentFeatured = false, listingId = null }) {
  if (!nextFeatured || currentFeatured) return;
  const row = listingId
    ? await get("SELECT COUNT(*) AS n FROM listings WHERE featured = 1 AND id != ?", listingId)
    : await get("SELECT COUNT(*) AS n FROM listings WHERE featured = 1");
  const featuredCount = Number(row?.n ?? 0);
  if (featuredCount >= MAX_FEATURED_LISTINGS) {
    const err = new Error(
      `Solo podés tener ${MAX_FEATURED_LISTINGS} anuncios destacados como máximo.`,
    );
    err.status = 422;
    throw err;
  }
}

const router = Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
// IMPORTANTE: rutas estáticas antes de /:id

router.get("/public/map", asyncHandler(async (req, res) => {
  let filter;
  try {
    filter = buildPublicListingWhere({ ...req.query, require_coords: "1" });
  } catch (err) {
    return res.status(err.status || 400).json({ detail: err.message });
  }

  const { where, params, polygon, orderSql } = filter;
  const rows = await all(
    `SELECT id, title, lat, lng, price, currency, rooms, area_sqm, property_type, operation, city, images
     FROM listings ${where} ORDER BY ${orderSql} LIMIT 500`,
    ...params,
  );
  const filtered = applyPolygonFilter(rows, polygon);

  return res.json({
    items: filtered.map(parseMapListing),
    total: filtered.length,
  });
}));

router.get("/public", asyncHandler(async (req, res) => {
  const { limit = 20, page = 1 } = req.query;

  let filter;
  try {
    filter = buildPublicListingWhere(req.query);
  } catch (err) {
    return res.status(err.status || 400).json({ detail: err.message });
  }

  const { where, params, polygon, orderSql } = filter;

  if (polygon) {
    const rows = await all(`SELECT * FROM listings ${where} ORDER BY ${orderSql}`, ...params);
    const filtered = applyPolygonFilter(rows, polygon);
    const paged = paginateArray(filtered.map(parsePublicListing), page, limit);
    return res.json(paged);
  }

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
    items: rows.map(parsePublicListing),
    total,
    page: pageN,
    pages: Math.ceil(total / limitN),
  });
}));

router.get("/public/:id", asyncHandler(async (req, res) => {
  const row = await get("SELECT * FROM listings WHERE id = ? AND status = 'active'", req.params.id);
  if (!row) return res.status(404).json({ detail: "Anuncio no encontrado" });
  await run("UPDATE listings SET view_count = view_count + 1 WHERE id = ?", req.params.id);
  return res.json(parsePublicListing({ ...row, view_count: (row.view_count || 0) + 1 }));
}));

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

router.get("/", verifyToken, asyncHandler(async (req, res) => {
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

  if (req.query.province_code) {
    if (!isValidProvinceCode(req.query.province_code)) {
      return res.status(400).json({ detail: "Código de provincia inválido" });
    }
    conds.push("province_code = ?");
    params.push(req.query.province_code);
  }

  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const orderSql =
    {
      views: "view_count DESC, updated_at DESC",
      consults: "consult_count DESC, updated_at DESC",
      destacadas: "featured DESC, (view_count + consult_count * 2) DESC, updated_at DESC",
      price_asc: "price ASC NULLS LAST",
      price_desc: "price DESC NULLS LAST",
      updated: "updated_at DESC",
    }[order_by] || "updated_at DESC";

  const rows = await all(`SELECT * FROM listings ${where} ORDER BY ${orderSql}`, ...params);
  return res.json(rows.map(parseListing));
}));

router.get("/:id", verifyToken, asyncHandler(async (req, res) => {
  const row = await get("SELECT * FROM listings WHERE id = ?", req.params.id);
  if (!row) return res.status(404).json({ detail: "Anuncio no encontrado" });
  return res.json(parseListing(row));
}));

router.post("/", verifyToken, asyncHandler(async (req, res) => {
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
    province_code,
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
    lot_polygon,
    referrer_name,
    referrer_lastname,
    referrer_phone,
  } = req.body;

  if (!title) return res.status(422).json({ detail: "El título es obligatorio" });
  if (!province?.trim()) return res.status(422).json({ detail: "La provincia es obligatoria" });
  const resolvedCode = resolveProvinceCode({ province_code, province });
  if (!resolvedCode) {
    return res.status(422).json({ detail: "Código o nombre de provincia inválido" });
  }
  if (price == null || price === "") return res.status(422).json({ detail: "El precio es obligatorio" });
  if (!currency?.trim()) return res.status(422).json({ detail: "La moneda es obligatoria" });

  let normalizedPropertyType;
  try {
    normalizedPropertyType = normalizePropertyType(property_type);
  } catch (err) {
    return res.status(err.status || 500).json({ detail: err.message });
  }

  try {
    await ensureFeaturedLimit({ nextFeatured: Boolean(featured) });
  } catch (err) {
    return res.status(err.status || 500).json({ detail: err.message });
  }

  const lotFields = resolveLotPolygonFields({
    propertyType: normalizedPropertyType,
    lot_polygon,
    lat,
    lng,
    area_sqm,
  });
  if (lotFields.error) return res.status(422).json({ detail: lotFields.error });

  const { lastInsertRowid } = await run(
    `
    INSERT INTO listings
    (title,description,property_type,status,operation,documentation,
     address,city,province,province_code,lat,lng,location_manual,
     rooms,area_sqm,price,currency,
     has_garage,has_garden,has_pool,has_patio,has_balcony,has_quincho,has_terrace,garage_count,covered_area_sqm,lot_polygon,featured,extras_note,images,
     commission_buyer,commission_seller,referrer_name,referrer_lastname,referrer_phone)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    RETURNING id
  `,
    title,
    description ?? null,
    normalizedPropertyType,
    status ?? "active",
    operation ?? "venta",
    documentation ?? null,
    address ?? null,
    city ?? null,
    province.trim(),
    resolvedCode,
    lotFields.lat,
    lotFields.lng,
    location_manual ?? null,
    rooms ?? null,
    lotFields.area_sqm,
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
    lotFields.lot_polygon,
    featured ? 1 : 0,
    extras_note ?? null,
    JSON.stringify(Array.isArray(images) ? images : []),
    commission_buyer ?? 3.0,
    commission_seller ?? 3.0,
    referrer_name ?? null,
    referrer_lastname ?? null,
    referrer_phone ?? null,
  );

  return res
    .status(201)
    .json(parseListing(await get("SELECT * FROM listings WHERE id = ?", lastInsertRowid)));
}));

router.patch("/:id", verifyToken, asyncHandler(async (req, res) => {
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
    "province_code",
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
    "lot_polygon",
    "featured",
    "extras_note",
    "images",
    "commission_buyer",
    "commission_seller",
    "referrer_name",
    "referrer_lastname",
    "referrer_phone",
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
  const nextProvinceCode =
    "province_code" in req.body ? req.body.province_code : existing.province_code;
  if (nextPrice == null || nextPrice === "") {
    return res.status(422).json({ detail: "El precio es obligatorio" });
  }
  if (!String(nextCurrency || "").trim()) {
    return res.status(422).json({ detail: "La moneda es obligatoria" });
  }
  if (!String(nextProvince || "").trim()) {
    return res.status(422).json({ detail: "La provincia es obligatoria" });
  }
  const resolvedPatchCode = resolveProvinceCode({
    province_code: nextProvinceCode,
    province: nextProvince,
  });
  if (!resolvedPatchCode) {
    return res.status(422).json({ detail: "Código o nombre de provincia inválido" });
  }
  req.body.province_code = resolvedPatchCode;
  if (!("province" in req.body) && resolvedPatchCode !== existing.province_code) {
    req.body.province = getProvinceName(resolvedPatchCode);
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
  const nextHasGarage = "has_garage" in req.body ? Boolean(req.body.has_garage) : Boolean(existing.has_garage);

  if ("property_type" in req.body) {
    try {
      req.body.property_type = normalizePropertyType(req.body.property_type, { required: true });
    } catch (err) {
      return res.status(err.status || 500).json({ detail: err.message });
    }
  }

  const effectivePropertyType = req.body.property_type ?? existing.property_type;
  if (!isLandPropertyType(effectivePropertyType)) {
    req.body.lot_polygon = null;
  } else if ("lot_polygon" in req.body) {
    const lotFields = resolveLotPolygonFields({
      propertyType: effectivePropertyType,
      lot_polygon: req.body.lot_polygon,
      lat: "lat" in req.body ? req.body.lat : existing.lat,
      lng: "lng" in req.body ? req.body.lng : existing.lng,
      area_sqm: "area_sqm" in req.body ? req.body.area_sqm : existing.area_sqm,
    });
    if (lotFields.error) return res.status(422).json({ detail: lotFields.error });
    req.body.lot_polygon = lotFields.lot_polygon;
    if (lotFields.lot_polygon) {
      req.body.area_sqm = lotFields.area_sqm;
      if (!("lat" in req.body)) req.body.lat = lotFields.lat;
      if (!("lng" in req.body)) req.body.lng = lotFields.lng;
    }
  }

  for (const f of FIELDS) {
    if (!(f in req.body)) continue;
    let v = req.body[f];
    if (f === "images") v = JSON.stringify(Array.isArray(v) ? v : []);
    if (f === "lot_polygon") {
      if (v == null || v === "") v = null;
      else if (Array.isArray(v)) v = JSON.stringify(v);
      else if (typeof v === "object") v = JSON.stringify(v);
    }
    if (f === "province" && typeof v === "string") v = v.trim();
    if (f === "province_code" && typeof v === "string" && !isValidProvinceCode(v)) {
      return res.status(422).json({ detail: "Código de provincia inválido" });
    }
    if (f === "currency" && typeof v === "string") v = v.trim();
    if (f === "price") v = Number(v);
    if (f === "covered_area_sqm") v = v == null || v === "" ? null : Number(v);
    if (f === "garage_count") v = v == null || v === "" ? null : Number(v);
    if (BOOL_FIELDS.has(f)) v = v ? 1 : 0;
    if (f === "garage_count" && !nextHasGarage) v = null;
    sets.push(`${f} = ?`);
    vals.push(v);
  }

  if (!nextHasGarage && !("garage_count" in req.body)) {
    sets.push("garage_count = ?");
    vals.push(null);
  }

  if (!sets.length) return res.json(parseListing(existing));

  sets.push("updated_at = CURRENT_TIMESTAMP");
  vals.push(req.params.id);
  await run(`UPDATE listings SET ${sets.join(", ")} WHERE id = ?`, ...vals);
  return res.json(parseListing(await get("SELECT * FROM listings WHERE id = ?", req.params.id)));
}));

router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  if (!(await get("SELECT id FROM listings WHERE id = ?", req.params.id))) {
    return res.status(404).json({ detail: "Anuncio no encontrado" });
  }
  await run("DELETE FROM listings WHERE id = ?", req.params.id);
  return res.status(204).send();
}));

export default router;
