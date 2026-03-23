/**
 * Política de contraseñas para cuentas nuevas / activación.
 * @returns {string|null} mensaje de error o null si es válida
 */
export function validateNewPassword(pw) {
  if (typeof pw !== "string" || pw.length < 12 || pw.length > 128) {
    return "La contraseña debe tener entre 12 y 128 caracteres.";
  }
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) {
    return "Incluí mayúsculas y minúsculas.";
  }
  if (!/[0-9]/.test(pw)) {
    return "Incluí al menos un número.";
  }
  if (!/[^a-zA-Z0-9]/.test(pw)) {
    return "Incluí al menos un carácter especial.";
  }
  return null;
}
