import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { verifyToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { get, all, run } from "../db.js";
import { sendInviteEmail, isEmailConfigured } from "../lib/email.js";
import { sha256Hex, randomInviteToken } from "../lib/tokens.js";

const router = Router();

router.use(verifyToken, requireAdmin);

const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.INVITE_RATE_LIMIT_PER_HOUR) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.sub ?? req.ip),
});

function normalizeEmail(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isVerified(user) {
  const v = user?.email_verified;
  return v === 1 || v === true || v === "1";
}

function inviteExpiryIso() {
  const h = Number(process.env.INVITE_EXPIRY_HOURS) || 48;
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}

const GENERIC_INVITE_OK = {
  detail:
    "Si el correo puede recibir la invitación, te enviamos un enlace. Revisá también la carpeta de spam.",
};

router.get("/", async (_req, res) => {
  const rows = await all(
    "SELECT id, email, role, created_at, email_verified, invite_token_hash, invite_expires_at FROM users ORDER BY id",
  );
  const list = rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    email_verified: isVerified(row),
    pending_activation: !isVerified(row) && Boolean(row.invite_token_hash),
    invite_expires_at: row.invite_expires_at || null,
  }));
  res.json(list);
});

router.post("/invite", inviteLimiter, async (req, res) => {
  if (!isEmailConfigured()) {
    return res.status(503).json({
      detail:
        "El envío de correo no está configurado. Definí SMTP_HOST, SMTP_FROM y credenciales en el servidor.",
    });
  }
  const baseUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, "");
  if (!baseUrl) {
    return res.status(503).json({
      detail: "Falta FRONTEND_URL en el servidor (URL pública del sitio, ej. https://tu-dominio.com).",
    });
  }

  const email = normalizeEmail(req.body?.email);
  const role = req.body?.role === "staff" ? "staff" : "admin";

  if (!isValidEmail(email)) {
    return res.status(422).json({ detail: "Correo electrónico inválido" });
  }

  const token = randomInviteToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = inviteExpiryIso();
  const placeholderPw = bcrypt.hashSync(crypto.randomBytes(48).toString("hex"), 12);

  try {
    const existing = await get("SELECT * FROM users WHERE email = ?", email);

    if (existing && isVerified(existing)) {
      return res.json(GENERIC_INVITE_OK);
    }

    if (existing) {
      await run(
        "UPDATE users SET invite_token_hash = ?, invite_expires_at = ?, role = ? WHERE id = ?",
        tokenHash,
        expiresAt,
        role,
        existing.id,
      );
    } else {
      await run(
        `INSERT INTO users (email, hashed_password, role, email_verified, invite_token_hash, invite_expires_at)
         VALUES (?, ?, ?, 0, ?, ?) RETURNING id`,
        email,
        placeholderPw,
        role,
        tokenHash,
        expiresAt,
      );
    }

    const inviteUrl = `${baseUrl}/admin/activar-cuenta?token=${encodeURIComponent(token)}`;
    await sendInviteEmail(email, inviteUrl);
  } catch (e) {
    console.error("[users/invite]", e);
    return res.status(500).json({ detail: "No se pudo completar la invitación" });
  }

  return res.status(201).json(GENERIC_INVITE_OK);
});

router.post("/:id/resend-invite", inviteLimiter, async (req, res) => {
  if (!isEmailConfigured() || !process.env.FRONTEND_URL?.trim()) {
    return res.status(503).json({ detail: "Correo o FRONTEND_URL no configurados en el servidor." });
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(422).json({ detail: "ID inválido" });
  }

  const user = await get("SELECT * FROM users WHERE id = ?", id);
  if (!user) return res.status(404).json({ detail: "Usuario no encontrado" });
  if (isVerified(user)) {
    return res.status(400).json({ detail: "Ese usuario ya está activo" });
  }

  const token = randomInviteToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = inviteExpiryIso();
  const baseUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, "");

  try {
    await run(
      "UPDATE users SET invite_token_hash = ?, invite_expires_at = ? WHERE id = ?",
      tokenHash,
      expiresAt,
      id,
    );
    const inviteUrl = `${baseUrl}/admin/activar-cuenta?token=${encodeURIComponent(token)}`;
    await sendInviteEmail(user.email, inviteUrl);
  } catch (e) {
    console.error("[users/resend-invite]", e);
    return res.status(500).json({ detail: "No se pudo reenviar el correo" });
  }

  return res.json({ detail: "Correo reenviado" });
});

export default router;
