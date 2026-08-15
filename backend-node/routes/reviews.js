import { randomBytes } from "crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { all, get, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  REVIEW_BODY_MAX_LEN,
  REVIEW_BODY_MIN_LEN,
  REVIEW_FEATURED_LIMIT,
  REVIEW_INVITE_EXPIRES_DAYS,
  REVIEW_MIN_FEATURED_RATING,
  REVIEW_STATUSES,
} from "../constants/reviews.js";

const router = Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Demasiadas reseñas desde esta red. Probá más tarde." },
});

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePhoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function parsePublicReview(row) {
  return {
    id: row.id,
    author_name: row.author_name,
    rating: Number(row.rating),
    body: row.body,
    created_at: row.created_at,
  };
}

function parseAdminReview(row) {
  return {
    id: row.id,
    visit_id: row.visit_id ?? null,
    invite_id: row.invite_id ?? null,
    author_name: row.author_name,
    author_email: row.author_email,
    author_phone: row.author_phone ?? null,
    rating: Number(row.rating),
    body: row.body,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    visit_name: row.visit_name ?? null,
    visit_status: row.visit_status ?? null,
  };
}

function parseInvite(row) {
  return {
    id: row.id,
    token: row.token,
    client_name: row.client_name,
    client_email: row.client_email ?? null,
    client_phone: row.client_phone ?? null,
    listing_id: row.listing_id ?? null,
    note: row.note ?? null,
    used_at: row.used_at ?? null,
    expires_at: row.expires_at ?? null,
    created_at: row.created_at,
  };
}

function inviteExpiryIso(days = REVIEW_INVITE_EXPIRES_DAYS) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function isInviteExpired(expiresAt) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) && t < Date.now();
}

/**
 * Cliente real vía visita confirmada (mismo email o teléfono).
 */
async function findConfirmedVisit({ email, phone }) {
  const emailNorm = normalizeEmail(email);
  if (emailNorm) {
    const byEmail = await get(
      `
      SELECT id, name, email, phone, status
      FROM visits
      WHERE status = 'confirmed'
        AND email IS NOT NULL
        AND LOWER(TRIM(email)) = ?
      ORDER BY id DESC
      LIMIT 1
    `,
      emailNorm,
    );
    if (byEmail) return byEmail;
  }

  const digits = normalizePhoneDigits(phone);
  if (digits.length >= 8) {
    const candidates = await all(
      `
      SELECT id, name, email, phone, status
      FROM visits
      WHERE status = 'confirmed'
        AND phone IS NOT NULL
        AND TRIM(phone) != ''
      ORDER BY id DESC
      LIMIT 80
    `,
    );
    return (
      candidates.find((v) => {
        const vDigits = normalizePhoneDigits(v.phone);
        return vDigits && (vDigits.endsWith(digits) || digits.endsWith(vDigits));
      }) || null
    );
  }
  return null;
}

async function findValidInvite(token) {
  const t = String(token || "").trim();
  if (!t || t.length < 16) return null;
  const invite = await get("SELECT * FROM review_invites WHERE token = ?", t);
  if (!invite) return null;
  if (invite.used_at) return { invite, error: "used" };
  if (isInviteExpired(invite.expires_at)) return { invite, error: "expired" };
  return { invite, error: null };
}

// GET /api/reviews/featured — público
router.get(
  "/featured",
  asyncHandler(async (_req, res) => {
    const rows = await all(
      `
      SELECT id, author_name, rating, body, created_at
      FROM reviews
      WHERE status = 'published'
        AND rating >= ?
      ORDER BY rating DESC, created_at DESC
      LIMIT ?
    `,
      REVIEW_MIN_FEATURED_RATING,
      REVIEW_FEATURED_LIMIT,
    );
    return res.json({ items: rows.map(parsePublicReview) });
  }),
);

// GET /api/reviews/invite/:token — público (precarga del formulario)
router.get(
  "/invite/:token",
  asyncHandler(async (req, res) => {
    const found = await findValidInvite(req.params.token);
    if (!found?.invite) {
      return res.status(404).json({ detail: "Invitación no encontrada" });
    }
    if (found.error === "used") {
      return res.status(410).json({ detail: "Esta invitación ya fue usada" });
    }
    if (found.error === "expired") {
      return res.status(410).json({ detail: "Esta invitación venció. Pedile un link nuevo a la inmobiliaria." });
    }
    const inv = found.invite;
    return res.json({
      token: inv.token,
      client_name: inv.client_name,
      client_email: inv.client_email ?? null,
      client_phone: inv.client_phone ?? null,
      expires_at: inv.expires_at,
    });
  }),
);

// POST /api/reviews — público (visita confirmada O invitación post-venta)
router.post(
  "/",
  submitLimiter,
  asyncHandler(async (req, res) => {
    if (req.body?.website || req.body?.company_url) {
      return res.status(201).json({
        ok: true,
        detail: "Gracias. Revisaremos tu reseña antes de publicarla.",
      });
    }

    const inviteToken = String(req.body?.invite_token || req.body?.token || "").trim();
    let author_name = String(req.body?.author_name || req.body?.name || "").trim();
    let author_email = normalizeEmail(req.body?.author_email || req.body?.email);
    let author_phone = String(req.body?.author_phone || req.body?.phone || "").trim() || null;
    const body = String(req.body?.body || req.body?.message || "").trim();
    const rating = Number(req.body?.rating);

    let visitId = null;
    let inviteId = null;

    if (inviteToken) {
      const found = await findValidInvite(inviteToken);
      if (!found?.invite) {
        return res.status(403).json({ detail: "Invitación inválida" });
      }
      if (found.error === "used") {
        return res.status(409).json({ detail: "Esta invitación ya fue usada" });
      }
      if (found.error === "expired") {
        return res.status(410).json({
          detail: "Esta invitación venció. Pedile un link nuevo a la inmobiliaria.",
        });
      }
      inviteId = found.invite.id;
      if (!author_name) author_name = String(found.invite.client_name || "").trim();
      if (!author_email && found.invite.client_email) {
        author_email = normalizeEmail(found.invite.client_email);
      }
      if (!author_phone && found.invite.client_phone) {
        author_phone = String(found.invite.client_phone).trim();
      }
    } else {
      if (!author_email || !author_email.includes("@")) {
        return res.status(422).json({ detail: "Indicá un email válido" });
      }
      const visit = await findConfirmedVisit({ email: author_email, phone: author_phone });
      if (!visit) {
        return res.status(403).json({
          detail:
            "Para calificar sin link de invitación necesitás una visita confirmada (mismo email o teléfono). Si cerraste una operación, pedile el link a LRV.",
        });
      }
      const existingVisitReview = await get("SELECT id FROM reviews WHERE visit_id = ?", visit.id);
      if (existingVisitReview) {
        return res.status(409).json({
          detail: "Ya registramos una reseña para esa visita. Si querés corregirla, escribinos.",
        });
      }
      visitId = visit.id;
    }

    if (!author_name) {
      return res.status(422).json({ detail: "El nombre es obligatorio" });
    }
    if (!author_email || !author_email.includes("@")) {
      return res.status(422).json({ detail: "Indicá un email válido" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(422).json({ detail: "La calificación debe ser entre 1 y 5" });
    }
    if (body.length < REVIEW_BODY_MIN_LEN) {
      return res.status(422).json({
        detail: `La reseña debe tener al menos ${REVIEW_BODY_MIN_LEN} caracteres`,
      });
    }
    if (body.length > REVIEW_BODY_MAX_LEN) {
      return res.status(422).json({
        detail: `La reseña no puede superar ${REVIEW_BODY_MAX_LEN} caracteres`,
      });
    }

    let result;
    try {
      result = await run(
        `
        INSERT INTO reviews
          (visit_id, invite_id, author_name, author_email, author_phone, rating, body, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        RETURNING id
      `,
        visitId,
        inviteId,
        author_name,
        author_email,
        author_phone,
        rating,
        body,
      );
    } catch (err) {
      const msg = String(err?.message || "");
      if (msg.includes("reviews_visit_id_uq") || msg.includes("reviews_invite_id_uq") || msg.includes("UNIQUE")) {
        return res.status(409).json({
          detail: "Ya registramos una reseña con ese acceso. Si querés corregirla, escribinos.",
        });
      }
      throw err;
    }

    if (inviteId) {
      await run(
        `UPDATE review_invites SET used_at = CURRENT_TIMESTAMP WHERE id = ? AND used_at IS NULL`,
        inviteId,
      );
    }

    return res.status(201).json({
      ok: true,
      id: result.lastInsertRowid,
      detail: "Gracias. Revisaremos tu reseña antes de publicarla.",
    });
  }),
);

// GET /api/reviews/invites — admin
router.get(
  "/invites",
  verifyToken,
  asyncHandler(async (req, res) => {
    const onlyOpen = req.query.open === "1" || req.query.open === "true";
    const rows = onlyOpen
      ? await all(
          `
          SELECT * FROM review_invites
          WHERE used_at IS NULL
          ORDER BY created_at DESC
          LIMIT 100
        `,
        )
      : await all(`SELECT * FROM review_invites ORDER BY created_at DESC LIMIT 100`);
    return res.json(rows.map(parseInvite));
  }),
);

// POST /api/reviews/invites — admin (al concretar venta)
router.post(
  "/invites",
  verifyToken,
  asyncHandler(async (req, res) => {
    const client_name = String(req.body?.client_name || req.body?.name || "").trim();
    const client_email = normalizeEmail(req.body?.client_email || req.body?.email) || null;
    const client_phone = String(req.body?.client_phone || req.body?.phone || "").trim() || null;
    const note = String(req.body?.note || "").trim() || null;
    const listing_id =
      req.body?.listing_id == null || req.body?.listing_id === ""
        ? null
        : Number(req.body.listing_id);

    if (!client_name) {
      return res.status(422).json({ detail: "El nombre del cliente es obligatorio" });
    }
    if (listing_id != null && !Number.isFinite(listing_id)) {
      return res.status(422).json({ detail: "listing_id inválido" });
    }

    const token = randomBytes(24).toString("hex");
    const expires_at = inviteExpiryIso();
    const result = await run(
      `
      INSERT INTO review_invites
        (token, client_name, client_email, client_phone, listing_id, note, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `,
      token,
      client_name,
      client_email,
      client_phone,
      listing_id,
      note,
      expires_at,
    );

    const invite = await get("SELECT * FROM review_invites WHERE id = ?", result.lastInsertRowid);
    return res.status(201).json(parseInvite(invite));
  }),
);

// GET /api/reviews — admin
router.get(
  "/",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const conds = [];
    const params = [];
    if (status && REVIEW_STATUSES.includes(String(status))) {
      conds.push("r.status = ?");
      params.push(String(status));
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const rows = await all(
      `
      SELECT r.*, v.name AS visit_name, v.status AS visit_status
      FROM reviews r
      LEFT JOIN visits v ON v.id = r.visit_id
      ${where}
      ORDER BY
        CASE r.status WHEN 'pending' THEN 0 WHEN 'published' THEN 1 ELSE 2 END,
        r.created_at DESC
    `,
      ...params,
    );
    return res.json(rows.map(parseAdminReview));
  }),
);

// PATCH /api/reviews/:id — admin
router.patch(
  "/:id",
  verifyToken,
  asyncHandler(async (req, res) => {
    const existing = await get("SELECT * FROM reviews WHERE id = ?", req.params.id);
    if (!existing) return res.status(404).json({ detail: "Reseña no encontrada" });

    const nextStatus = String(req.body?.status || "").trim();
    if (!REVIEW_STATUSES.includes(nextStatus)) {
      return res.status(422).json({
        detail: `Estado inválido. Valores: ${REVIEW_STATUSES.join(", ")}`,
      });
    }

    await run(
      `UPDATE reviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      nextStatus,
      req.params.id,
    );
    const row = await get(
      `
      SELECT r.*, v.name AS visit_name, v.status AS visit_status
      FROM reviews r
      LEFT JOIN visits v ON v.id = r.visit_id
      WHERE r.id = ?
    `,
      req.params.id,
    );
    return res.json(parseAdminReview(row));
  }),
);

// DELETE /api/reviews/:id — admin
router.delete(
  "/:id",
  verifyToken,
  asyncHandler(async (req, res) => {
    const existing = await get("SELECT id FROM reviews WHERE id = ?", req.params.id);
    if (!existing) return res.status(404).json({ detail: "Reseña no encontrada" });
    await run("DELETE FROM reviews WHERE id = ?", req.params.id);
    return res.json({ ok: true });
  }),
);

export default router;
