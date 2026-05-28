/** Tipos de propiedad almacenados en `listings.property_type`. */

export const PROPERTY_CATEGORY = {
  PROPIEDAD: "propiedad",
  INVERSION: "inversion",
};

export const RESIDENTIAL_PROPERTY_TYPES = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "lote", label: "Lote" },
  { value: "terreno", label: "Terreno" },
  { value: "finca", label: "Finca" },
];

export const INVESTMENT_PROPERTY_TYPES = [
  { value: "local_comercial", label: "Locales comerciales" },
  { value: "fondo_comercio", label: "Fondos de comercio" },
];

/** Listado plano para filtros y selects con optgroup. */
export const PROPERTY_TYPES = [
  ...RESIDENTIAL_PROPERTY_TYPES,
  ...INVESTMENT_PROPERTY_TYPES,
];

export const PROPERTY_TYPE_GROUPS = [
  { id: PROPERTY_CATEGORY.PROPIEDAD, label: "Propiedades", options: RESIDENTIAL_PROPERTY_TYPES },
  {
    id: PROPERTY_CATEGORY.INVERSION,
    label: "Oportunidades de inversión",
    options: INVESTMENT_PROPERTY_TYPES,
  },
];

const INVESTMENT_VALUES = new Set(INVESTMENT_PROPERTY_TYPES.map((t) => t.value));

export const ALLOWED_PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((t) => t.value);

export const TYPE_LABELS = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.value, t.label]));

export const LAND_PROPERTY_TYPES = ["terreno", "lote", "finca"];

const LAND_VALUES = new Set(LAND_PROPERTY_TYPES);

export function isLandPropertyType(propertyType) {
  return LAND_VALUES.has(String(propertyType || "").trim().toLowerCase());
}

export function isInvestmentPropertyType(propertyType) {
  return INVESTMENT_VALUES.has(propertyType);
}

export function getPropertyCategory(propertyType) {
  return isInvestmentPropertyType(propertyType)
    ? PROPERTY_CATEGORY.INVERSION
    : PROPERTY_CATEGORY.PROPIEDAD;
}

export function getTypesForCategory(category) {
  return category === PROPERTY_CATEGORY.INVERSION
    ? INVESTMENT_PROPERTY_TYPES
    : RESIDENTIAL_PROPERTY_TYPES;
}

export function defaultPropertyTypeForCategory(category) {
  return getTypesForCategory(category)[0]?.value ?? "casa";
}
