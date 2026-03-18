import { Router } from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

// GET /api/transactions/balance
router.get("/balance", (req, res) => {
  const { from, to } = req.query;
  const conds = [];
  const params = [];
  if (from) {
    conds.push("date >= ?");
    params.push(from);
  }
  if (to) {
    conds.push("date <= ?");
    params.push(to);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  const rows = db
    .prepare(`SELECT type, COALESCE(SUM(amount),0) total FROM transactions ${where} GROUP BY type`)
    .all(...params);
  const income = rows.find((r) => r.type === "income")?.total ?? 0;
  const expense = rows.find((r) => r.type === "expense")?.total ?? 0;
  return res.json({ income, expense, balance: income - expense });
});

// GET /api/transactions/export/csv
router.get("/export/csv", (req, res) => {
  const { from, to, type } = req.query;
  const conds = [];
  const params = [];
  if (from) {
    conds.push("t.date >= ?");
    params.push(from);
  }
  if (to) {
    conds.push("t.date <= ?");
    params.push(to);
  }
  if (type) {
    conds.push("t.type = ?");
    params.push(type);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  const rows = db
    .prepare(`
    SELECT t.*, l.title AS listing_title
    FROM transactions t LEFT JOIN listings l ON t.listing_id = l.id
    ${where} ORDER BY t.date DESC, t.created_at DESC
  `)
    .all(...params);

  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    "ID,Fecha,Descripción,Tipo,Categoría,Monto,Propiedad,Notas",
    ...rows.map((r) =>
      [
        r.id,
        r.date ?? "",
        esc(r.description),
        r.type,
        r.category ?? "",
        r.amount,
        esc(r.listing_title ?? ""),
        esc(r.notes ?? ""),
      ].join(","),
    ),
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="transacciones.csv"');
  return res.send("\uFEFF" + lines.join("\r\n"));
});

// GET /api/transactions
router.get("/", (req, res) => {
  const { from, to, type, category, limit = 50, page = 1 } = req.query;
  const conds = [];
  const params = [];
  if (from) {
    conds.push("t.date >= ?");
    params.push(from);
  }
  if (to) {
    conds.push("t.date <= ?");
    params.push(to);
  }
  if (type) {
    conds.push("t.type = ?");
    params.push(type);
  }
  if (category) {
    conds.push("t.category = ?");
    params.push(category);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const limitN = Math.min(Number(limit) || 50, 200);
  const pageN = Math.max(Number(page) || 1, 1);

  const rows = db
    .prepare(`
    SELECT t.*, l.title AS listing_title
    FROM transactions t LEFT JOIN listings l ON t.listing_id = l.id
    ${where} ORDER BY t.date DESC, t.created_at DESC
    LIMIT ? OFFSET ?
  `)
    .all(...params, limitN, (pageN - 1) * limitN);

  return res.json(rows);
});

// POST /api/transactions
router.post("/", (req, res) => {
  const { description, amount, type, category, date, notes, listing_id } = req.body;
  if (!description || amount == null || !type) {
    return res.status(422).json({ detail: "Descripción, monto y tipo son obligatorios" });
  }
  const result = db
    .prepare(`
    INSERT INTO transactions (description, amount, type, category, date, notes, listing_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      description,
      Number(amount),
      type,
      category ?? null,
      date ?? null,
      notes ?? null,
      listing_id ?? null,
    );

  const id = Number(result.lastInsertRowid);
  return res.status(201).json(db.prepare("SELECT * FROM transactions WHERE id = ?").get(id));
});

// PATCH /api/transactions/:id
router.patch("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ detail: "Movimiento no encontrado" });

  const FIELDS = ["description", "amount", "type", "category", "date", "notes", "listing_id"];
  const sets = [];
  const vals = [];
  for (const f of FIELDS) {
    if (f in req.body) {
      sets.push(`${f} = ?`);
      vals.push(f === "amount" ? Number(req.body[f]) : req.body[f]);
    }
  }
  if (!sets.length) return res.json(existing);
  vals.push(req.params.id);
  db.prepare(`UPDATE transactions SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return res.json(db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id));
});

// DELETE /api/transactions/:id
router.delete("/:id", (req, res) => {
  if (!db.prepare("SELECT id FROM transactions WHERE id = ?").get(req.params.id)) {
    return res.status(404).json({ detail: "Movimiento no encontrado" });
  }
  db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
  return res.status(204).send();
});

export default router;
