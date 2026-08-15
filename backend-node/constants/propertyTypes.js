/** Valores permitidos para `listings.property_type` (TEXT en BD). */

export const ALLOWED_PROPERTY_TYPES = [
  "lotes_terrenos",
  "casa",
  "departamento",
  "casa_quinta",
  "quincho",
];

/** Valores permitidos para `listings.investment_tag` (nullable). */
export const ALLOWED_INVESTMENT_TAGS = [
  "finca",
  "campo",
  "local_comercial",
  "complejo_recreativo",
  "edificio",
  "fondo_comercio",
  "loteo",
];

export const LAND_PROPERTY_TYPES = ["lotes_terrenos"];

const ALLOWED_SET = new Set(ALLOWED_PROPERTY_TYPES);
const LAND_SET = new Set(LAND_PROPERTY_TYPES);
const INVESTMENT_SET = new Set(ALLOWED_INVESTMENT_TAGS);

export function isLandPropertyType(propertyType) {
  return LAND_SET.has(String(propertyType || "").trim().toLowerCase());
}

/**
 * Valida y normaliza el tipo de propiedad.
 * @param {string|undefined|null} propertyType
 * @param {{ required?: boolean }} [opts]
 * @returns {string}
 */
export function normalizePropertyType(propertyType, { required = false } = {}) {
  if (propertyType == null || propertyType === "") {
    if (required) {
      const err = new Error("El tipo de propiedad es obligatorio");
      err.status = 422;
      throw err;
    }
    return "casa";
  }
  const normalized = String(propertyType).trim().toLowerCase();
  if (!ALLOWED_SET.has(normalized)) {
    const err = new Error(
      `Tipo de propiedad no válido. Valores permitidos: ${ALLOWED_PROPERTY_TYPES.join(", ")}`,
    );
    err.status = 422;
    throw err;
  }
  return normalized;
}

/**
 * Valida tag de inversión (null = no es oportunidad de inversión).
 * @param {string|undefined|null} tag
 * @returns {string|null}
 */
export function normalizeInvestmentTag(tag) {
  if (tag == null || tag === "") return null;
  const normalized = String(tag).trim().toLowerCase();
  if (!INVESTMENT_SET.has(normalized)) {
    const err = new Error(
      `Tag de inversión no válido. Valores permitidos: ${ALLOWED_INVESTMENT_TAGS.join(", ")}`,
    );
    err.status = 422;
    throw err;
  }
  return normalized;
}
