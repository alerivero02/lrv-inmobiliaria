import { Router } from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// POST /api/visits — público
router.post("/", (req, res) => {
  const { listing_id, name, email, phone, message, preferred_date, preferred_time } = req.body;
  if (!name) return res.status(422).json({ detail: "El nombre es obligatorio" });

  const result = db
    .prepare(`
    INSERT INTO visits (listing_id, name, email, phone, message, preferred_date, preferred_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `)
    .run(
      listing_id ?? null,
      name,
      email ?? null,
      phone ?? null,
      message ?? null,
      preferred_date ?? null,
      preferred_time ?? null,
    );

  if (listing_id) {
    db.prepare("UPDATE listings SET consult_count = consult_count + 1 WHERE id = ?").run(
      listing_id,
    );
  }

  const id = Number(result.lastInsertRowid);
  const visit = db.prepare("SELECT * FROM visits WHERE id = ?").get(id);
  return res.status(201).json(visit);
});

// GET /api/visits — admin
router.get("/", verifyToken, (req, res) => {
  const { status, listing_id, limit = 50, page = 1 } = req.query;
  const conds = [];
  const params = [];

  if (status) {
    conds.push("v.status = ?");
    params.push(status);
  }
  if (listing_id) {
    conds.push("v.listing_id = ?");
    params.push(Number(listing_id));
  }

  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const limitN = Math.min(Number(limit) || 50, 200);
  const pageN = Math.max(Number(page) || 1, 1);

  const rows = db
    .prepare(`
    SELECT v.*, l.title AS listing_title
    FROM visits v
    LEFT JOIN listings l ON v.listing_id = l.id
    ${where}
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `)
    .all(...params, limitN, (pageN - 1) * limitN);

  return res.json(rows);
});

// PATCH /api/visits/:id — admin
router.patch("/:id", verifyToken, (req, res) => {
  const existing = db.prepare("SELECT * FROM visits WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ detail: "Visita no encontrada" });

  const FIELDS = [
    "status",
    "name",
    "email",
    "phone",
    "message",
    "preferred_date",
    "preferred_time",
  ];
  const sets = [];
  const vals = [];

  for (const f of FIELDS) {
    if (f in req.body) {
      sets.push(`${f} = ?`);
      vals.push(req.body[f]);
    }
  }
  if (!sets.length) return res.json(existing);

  sets.push("updated_at = datetime('now')");
  vals.push(req.params.id);
  db.prepare(`UPDATE visits SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return res.json(db.prepare("SELECT * FROM visits WHERE id = ?").get(req.params.id));
});

export default router;
