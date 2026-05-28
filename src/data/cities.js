// Localidades de La Rioja, Argentina (para selector + opción manual)
export const CITIES_LA_RIOJA = [
  "La Rioja",
  "Chilecito",
  "Chamical",
  "Aimogasta",
  "Chepes",
  "Arauco",
  "Famatina",
  "Villa Unión",
  "Chilecito",
  "Nonogasta",
  "Vinchina",
  "San Blas de los Sauces",
  "Ulapes",
  "Tama",
  "Olta",
  "Milagro",
  "Malanzán",
  "Patquía",
  "Sanagasta",
  "Villa Sanagasta",
  "Aminga",
  "Anillaco",
  "Pinchas",
  "Sañogasta",
];

export {
  PROPERTY_TYPES,
  PROPERTY_TYPE_GROUPS,
  PROPERTY_CATEGORY,
  RESIDENTIAL_PROPERTY_TYPES,
  INVESTMENT_PROPERTY_TYPES,
  TYPE_LABELS,
  ALLOWED_PROPERTY_TYPE_VALUES,
  isInvestmentPropertyType,
  getPropertyCategory,
  getTypesForCategory,
  defaultPropertyTypeForCategory,
} from "./propertyTypes.js";

export {
  ARGENTINA_PROVINCES,
  DEFAULT_PROVINCE_CODE,
  getProvinceByCode,
  getProvinceByName,
  getProvinceName,
} from "./provinces.js";

export const STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "paused", label: "Pausado" },
  { value: "sold", label: "Vendido/Alquilado" },
  { value: "archived", label: "Archivado" },
  { value: "pending_review", label: "Pendiente de revisión" },
];

export const OPERATION_OPTIONS = [
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
];
