import crypto from "crypto";

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

/** Token opaco para enlaces de invitación (64 hex). */
export function randomInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}
