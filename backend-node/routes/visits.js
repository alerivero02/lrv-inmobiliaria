import { Router } from "express";
import { get, all, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

/** Fecha yyyy-mm-dd desde distintos formatos guardados en DB. */
function normalizeVisitDate(d) {
  if (d == null || d === "") return "";
  const s = String(d).trim();
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : s.slice(0, 10);
}

/** Hora HH:mm comparable entre DB y cliente. */
function normalizeVisitTime(t) {
  if (t == null || t === "") return "";
  const s = String(t).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
}

// GET /api/visits/occupied-slots — público (para formulario sin solapar turnos)
router.get("/occupied-slots", async (_req, res) => {
  const rows = await all(
    `
    SELECT preferred_date, preferred_time
    FROM visits
    WHERE status IN ('pending', 'confirmed')
      AND preferred_date IS NOT NULL
      AND preferred_time IS NOT NULL
      AND TRIM(preferred_date) != ''
      AND TRIM(preferred_time) != ''
  `,
  );
  const slots = rows.map((r) => ({
    date: normalizeVisitDate(r.preferred_date),
    time: normalizeVisitTime(r.preferred_time),
  }));
  return res.json({ slots });
});

// POST /api/visits — público
router.post("/", async (req, res) => {
  const { listing_id, name, email, phone, message, preferred_date, preferred_time } = req.body;
  if (!name) return res.status(422).json({ detail: "El nombre es obligatorio" });

  const nd = normalizeVisitDate(preferred_date);
  const nt = normalizeVisitTime(preferred_time);
  if (nd && nt) {
    const conflicts = await all(
      `
      SELECT id, preferred_time FROM visits
      WHERE preferred_date = ?
        AND status IN ('pending', 'confirmed')
    `,
      nd,
    );
    const taken = conflicts.some((row) => normalizeVisitTime(row.preferred_time) === nt);
    if (taken) {
      return res.status(409).json({
        detail:
          "Ese día y horario ya tienen una visita solicitada o confirmada. Elegí otro turno.",
      });
    }
  }

  const result = await run(
    `
    INSERT INTO visits (listing_id, name, email, phone, message, preferred_date, preferred_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    RETURNING id
  `,
    listing_id ?? null,
    name,
    email ?? null,
    phone ?? null,
    message ?? null,
    nd || preferred_date || null,
    nt || preferred_time || null,
  );

  if (listing_id) {
    await run("UPDATE listings SET consult_count = consult_count + 1 WHERE id = ?", listing_id);
  }

  const id = Number(result.lastInsertRowid);
  const visit = await get("SELECT * FROM visits WHERE id = ?", id);
  return res.status(201).json(visit);
});

// GET /api/visits — admin
router.get("/", verifyToken, async (req, res) => {
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

  const rows = await all(
    `
    SELECT v.*, l.title AS listing_title
    FROM visits v
    LEFT JOIN listings l ON v.listing_id = l.id
    ${where}
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `,
    ...params,
    limitN,
    (pageN - 1) * limitN,
  );

  return res.json(rows);
});

// PATCH /api/visits/:id — admin
router.patch("/:id", verifyToken, async (req, res) => {
  const existing = await get("SELECT * FROM visits WHERE id = ?", req.params.id);
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

  sets.push("updated_at = CURRENT_TIMESTAMP");
  vals.push(req.params.id);
  await run(`UPDATE visits SET ${sets.join(", ")} WHERE id = ?`, ...vals);
  return res.json(await get("SELECT * FROM visits WHERE id = ?", req.params.id));
});

export default router;
