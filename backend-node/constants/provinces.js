/** ISO 3166-2:AR — debe coincidir con src/data/provinces.js */
export const ARGENTINA_PROVINCES = [
  { code: "AR-B", name: "Buenos Aires" },
  { code: "AR-K", name: "Catamarca" },
  { code: "AR-H", name: "Chaco" },
  { code: "AR-U", name: "Chubut" },
  { code: "AR-C", name: "Ciudad Autónoma de Buenos Aires" },
  { code: "AR-X", name: "Córdoba" },
  { code: "AR-W", name: "Corrientes" },
  { code: "AR-E", name: "Entre Ríos" },
  { code: "AR-P", name: "Formosa" },
  { code: "AR-Y", name: "Jujuy" },
  { code: "AR-L", name: "La Pampa" },
  { code: "AR-F", name: "La Rioja" },
  { code: "AR-M", name: "Mendoza" },
  { code: "AR-N", name: "Misiones" },
  { code: "AR-Q", name: "Neuquén" },
  { code: "AR-R", name: "Río Negro" },
  { code: "AR-A", name: "Salta" },
  { code: "AR-J", name: "San Juan" },
  { code: "AR-D", name: "San Luis" },
  { code: "AR-Z", name: "Santa Cruz" },
  { code: "AR-S", name: "Santa Fe" },
  { code: "AR-G", name: "Santiago del Estero" },
  { code: "AR-V", name: "Tierra del Fuego" },
  { code: "AR-T", name: "Tucumán" },
];

export const DEFAULT_PROVINCE_CODE = "AR-F";

const VALID_CODES = new Set(ARGENTINA_PROVINCES.map((p) => p.code));
const byNameNorm = new Map(
  ARGENTINA_PROVINCES.map((p) => [normalizeProvinceName(p.name), p]),
);

export function normalizeProvinceName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function isValidProvinceCode(code) {
  return VALID_CODES.has(code);
}

export function getProvinceByCode(code) {
  return ARGENTINA_PROVINCES.find((p) => p.code === code) ?? null;
}

export function getProvinceByName(name) {
  return byNameNorm.get(normalizeProvinceName(name)) ?? null;
}

export function resolveProvinceCode({ province_code, province }) {
  if (province_code && isValidProvinceCode(province_code)) return province_code;
  return getProvinceByName(province)?.code ?? null;
}

export function getProvinceName(code) {
  return getProvinceByCode(code)?.name ?? code;
}
