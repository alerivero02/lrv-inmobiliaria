import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { get, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { validateNewPassword } from "../lib/passwordPolicy.js";
import { sha256Hex, randomInviteToken } from "../lib/tokens.js";
import { sendPasswordResetEmail, isEmailConfigured } from "../lib/email.js";

const router = Router();
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("Falta JWT_SECRET (requerido).");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

const completeInviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.COMPLETE_INVITE_RATE_LIMIT) || 25,
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordBodyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RESET_PASSWORD_RATE_LIMIT) || 25,
  standardHeaders: true,
  legacyHeaders: false,
});

function isVerified(user) {
  const v = user?.email_verified;
  return v === 1 || v === true || v === "1";
}

const FORGOT_PASSWORD_OK = {
  detail:
    "Si ese correo tiene una cuenta activa, enviamos instrucciones para restablecer la contraseña. Revisá también spam.",
};

function normalizeEmailLogin(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

function resetExpiryIso() {
  const mins = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 60;
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

router.get("/me", verifyToken, (req, res) => {
  res.json({
    id: req.user.sub,
    email: req.user.email,
    role: req.user.role,
  });
});

router.post("/change-password", verifyToken, async (req, res) => {
  const current = req.body?.current_password;
  const nextPw = req.body?.new_password;
  if (!current || !nextPw) {
    return res.status(422).json({ detail: "Contraseña actual y nueva son obligatorias" });
  }

  const user = await get("SELECT * FROM users WHERE id = ?", req.user.sub);
  if (!user || !bcrypt.compareSync(current, user.hashed_password)) {
    return res.status(401).json({ detail: "Contraseña actual incorrecta" });
  }

  const policyErr = validateNewPassword(nextPw);
  if (policyErr) {
    return res.status(422).json({ detail: policyErr });
  }
  if (bcrypt.compareSync(nextPw, user.hashed_password)) {
    return res.status(422).json({ detail: "La nueva contraseña debe ser distinta a la actual." });
  }

  const hashed = bcrypt.hashSync(nextPw, 12);
  await run("UPDATE users SET hashed_password = ? WHERE id = ?", hashed, user.id);
  return res.json({ detail: "Contraseña actualizada correctamente." });
});

router.post("/forgot-password", async (req, res) => {
  const email = normalizeEmailLogin(req.body?.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ detail: "Indicá un correo electrónico válido" });
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({
      detail:
        "El envío de correo no está configurado en el servidor (SMTP). Pedí ayuda a quien administra el hosting.",
    });
  }

  const baseUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, "");
  if (!baseUrl) {
    return res.status(503).json({ detail: "Falta FRONTEND_URL en el servidor." });
  }

  const user = await get("SELECT * FROM users WHERE email = ?", email);
  if (!user || !isVerified(user)) {
    return res.json(FORGOT_PASSWORD_OK);
  }

  const token = randomInviteToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = resetExpiryIso();

  try {
    await run(
      "UPDATE users SET reset_token_hash = ?, reset_expires_at = ? WHERE id = ?",
      tokenHash,
      expiresAt,
      user.id,
    );
    const resetUrl = `${baseUrl}/admin/restablecer-contrasena?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (e) {
    console.error("[auth/forgot-password]", e);
    return res.status(500).json({ detail: "No se pudo enviar el correo. Intentá más tarde." });
  }

  return res.json(FORGOT_PASSWORD_OK);
});

router.post("/reset-password", resetPasswordBodyLimiter, async (req, res) => {
  const tokenRaw = String(req.body?.token ?? "").trim();
  const password = req.body?.password;
  if (!tokenRaw || !password) {
    return res.status(422).json({ detail: "Token y contraseña requeridos" });
  }

  const policyErr = validateNewPassword(password);
  if (policyErr) {
    return res.status(422).json({ detail: policyErr });
  }

  const tokenHash = sha256Hex(tokenRaw);
  const user = await get("SELECT * FROM users WHERE reset_token_hash = ?", tokenHash);
  if (!user) {
    return res.status(400).json({ detail: "Enlace inválido o expirado" });
  }

  const exp = user.reset_expires_at ? new Date(user.reset_expires_at).getTime() : 0;
  if (!exp || exp < Date.now()) {
    return res.status(400).json({ detail: "Enlace inválido o expirado" });
  }

  const hashed = bcrypt.hashSync(password, 12);
  await run(
    "UPDATE users SET hashed_password = ?, reset_token_hash = NULL, reset_expires_at = NULL WHERE id = ?",
    hashed,
    user.id,
  );

  return res.json({ detail: "Contraseña actualizada. Ya podés iniciar sesión." });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(422).json({ detail: "Usuario y contraseña requeridos" });
  }

  const user = await get("SELECT * FROM users WHERE email = ?", String(username).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
    return res.status(401).json({ detail: "Credenciales incorrectas" });
  }

  if (!isVerified(user)) {
    return res.status(403).json({
      detail:
        "Esta cuenta aún no está activada. Abrí el enlace que enviamos a tu correo o pedile a un administrador que reenvíe la invitación.",
    });
  }

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return res.json({
    access_token: token,
    token_type: "bearer",
    expires_in: JWT_EXPIRES_IN,
    user: { email: user.email, role: user.role },
  });
});

router.post("/complete-invite", completeInviteLimiter, async (req, res) => {
  const tokenRaw = String(req.body?.token ?? "").trim();
  const password = req.body?.password;
  if (!tokenRaw || !password) {
    return res.status(422).json({ detail: "Token y contraseña requeridos" });
  }

  const policyErr = validateNewPassword(password);
  if (policyErr) {
    return res.status(422).json({ detail: policyErr });
  }

  const tokenHash = sha256Hex(tokenRaw);
  const user = await get("SELECT * FROM users WHERE invite_token_hash = ?", tokenHash);
  if (!user) {
    return res.status(400).json({ detail: "Enlace inválido o expirado" });
  }

  const exp = user.invite_expires_at ? new Date(user.invite_expires_at).getTime() : 0;
  if (!exp || exp < Date.now()) {
    return res.status(400).json({ detail: "Enlace inválido o expirado" });
  }

  const hashed = bcrypt.hashSync(password, 12);
  await run(
    "UPDATE users SET hashed_password = ?, email_verified = 1, invite_token_hash = NULL, invite_expires_at = NULL WHERE id = ?",
    hashed,
    user.id,
  );

  return res.json({ detail: "Cuenta activada. Ya podés iniciar sesión." });
});

export default router;
