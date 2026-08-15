/** Tipos de propiedad almacenados en `listings.property_type`. */

export const PROPERTY_TYPES = [
  { value: "lotes_terrenos", label: "Lotes/Terrenos" },
  { value: "casa", label: "Casas" },
  { value: "departamento", label: "Departamentos" },
  { value: "casa_quinta", label: "Casa Quinta" },
  { value: "quincho", label: "Quincho" },
];

/** Tags opcionales de oportunidad de inversión (`listings.investment_tag`). */
export const INVESTMENT_TAGS = [
  { value: "finca", label: "Fincas" },
  { value: "campo", label: "Campos" },
  { value: "local_comercial", label: "Locales comerciales" },
  { value: "complejo_recreativo", label: "Complejo recreativo/deportivo" },
  { value: "edificio", label: "Edificios" },
  { value: "fondo_comercio", label: "Fondos de comercio" },
  { value: "loteo", label: "Loteos" },
];

export const ALLOWED_PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((t) => t.value);
export const ALLOWED_INVESTMENT_TAG_VALUES = INVESTMENT_TAGS.map((t) => t.value);

export const TYPE_LABELS = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.value, t.label]));
export const INVESTMENT_TAG_LABELS = Object.fromEntries(
  INVESTMENT_TAGS.map((t) => [t.value, t.label]),
);

export const LAND_PROPERTY_TYPES = ["lotes_terrenos"];

const LAND_VALUES = new Set(LAND_PROPERTY_TYPES);

export function isLandPropertyType(propertyType) {
  return LAND_VALUES.has(String(propertyType || "").trim().toLowerCase());
}

export function isInvestmentListing(investmentTag) {
  return investmentTag != null && String(investmentTag).trim() !== "";
}

export function getInvestmentTagLabel(tag) {
  if (!tag) return null;
  return INVESTMENT_TAG_LABELS[tag] ?? tag;
}
