import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "1";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass: pass || "" } : undefined,
  });
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

/**
 * @param {string} to
 * @param {string} inviteUrl URL absoluta de activación
 */
export async function sendInviteEmail(to, inviteUrl) {
  const transport = getTransport();
  if (!transport) {
    throw new Error("SMTP no configurado (SMTP_HOST / SMTP_FROM)");
  }
  const from = process.env.SMTP_FROM.trim();
  const subject = process.env.SMTP_INVITE_SUBJECT || "Activá tu cuenta — LRV Admin";
  const text = [
    "Recibiste una invitación para acceder al panel de administración de LRV Inmobiliaria.",
    "",
    "Abrí este enlace para elegir tu contraseña y activar la cuenta (caduca en 48 horas):",
    inviteUrl,
    "",
    "Si no solicitaste este acceso, ignorá este mensaje.",
  ].join("\n");

  const html = `
  <p>Recibiste una invitación para acceder al panel de administración de <strong>LRV Inmobiliaria</strong>.</p>
  <p><a href="${inviteUrl.replace(/"/g, "&quot;")}">Activar cuenta y elegir contraseña</a></p>
  <p style="color:#666;font-size:12px;">El enlace caduca en 48 horas. Si no solicitaste este acceso, ignorá este correo.</p>
  `.trim();

  await transport.sendMail({ from, to, subject, text, html });
}

/**
 * @param {string} to
 * @param {string} resetUrl URL absoluta para restablecer contraseña
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  const transport = getTransport();
  if (!transport) {
    throw new Error("SMTP no configurado (SMTP_HOST / SMTP_FROM)");
  }
  const from = process.env.SMTP_FROM.trim();
  const subject = process.env.SMTP_RESET_SUBJECT || "Restablecer contraseña — LRV Admin";
  const text = [
    "Recibimos una solicitud para restablecer la contraseña de tu cuenta en LRV Admin.",
    "",
    "Abrí este enlace (caduca en 1 hora):",
    resetUrl,
    "",
    "Si no fuiste vos, ignorá este mensaje.",
  ].join("\n");

  const html = `
  <p>Solicitud para restablecer la contraseña de <strong>LRV Admin</strong>.</p>
  <p><a href="${resetUrl.replace(/"/g, "&quot;")}">Elegir nueva contraseña</a></p>
  <p style="color:#666;font-size:12px;">El enlace caduca en 1 hora. Si no solicitaste el cambio, ignorá este correo.</p>
  `.trim();

  await transport.sendMail({ from, to, subject, text, html });
}
