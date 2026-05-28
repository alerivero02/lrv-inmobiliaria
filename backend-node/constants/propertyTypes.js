/** Valores permitidos para `listings.property_type` (TEXT en BD). */

export const RESIDENTIAL_PROPERTY_TYPES = [
  "casa",
  "departamento",
  "lote",
  "terreno",
  "finca",
];

export const INVESTMENT_PROPERTY_TYPES = ["local_comercial", "fondo_comercio"];

export const ALLOWED_PROPERTY_TYPES = [
  ...RESIDENTIAL_PROPERTY_TYPES,
  ...INVESTMENT_PROPERTY_TYPES,
];

export const LAND_PROPERTY_TYPES = ["terreno", "lote", "finca"];

const ALLOWED_SET = new Set(ALLOWED_PROPERTY_TYPES);
const LAND_SET = new Set(LAND_PROPERTY_TYPES);

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
