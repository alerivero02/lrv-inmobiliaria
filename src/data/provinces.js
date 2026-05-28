/**
 * Provincias argentinas con código ISO 3166-2:AR (identificador oficial).
 * Usar siempre `code` en filtros API y formularios; `name` solo para UI.
 */
export const ARGENTINA_PROVINCES = [
  { code: "AR-B", name: "Buenos Aires", center: { lat: -36.5, lng: -60.0 } },
  { code: "AR-K", name: "Catamarca", center: { lat: -28.47, lng: -65.78 } },
  { code: "AR-H", name: "Chaco", center: { lat: -27.45, lng: -58.99 } },
  { code: "AR-U", name: "Chubut", center: { lat: -43.3, lng: -65.1 } },
  { code: "AR-C", name: "Ciudad Autónoma de Buenos Aires", center: { lat: -34.61, lng: -58.38 } },
  { code: "AR-X", name: "Córdoba", center: { lat: -31.42, lng: -64.19 } },
  { code: "AR-W", name: "Corrientes", center: { lat: -27.47, lng: -58.83 } },
  { code: "AR-E", name: "Entre Ríos", center: { lat: -31.73, lng: -60.53 } },
  { code: "AR-P", name: "Formosa", center: { lat: -26.18, lng: -58.18 } },
  { code: "AR-Y", name: "Jujuy", center: { lat: -24.19, lng: -65.3 } },
  { code: "AR-L", name: "La Pampa", center: { lat: -36.62, lng: -64.28 } },
  { code: "AR-F", name: "La Rioja", center: { lat: -29.41, lng: -66.85 } },
  { code: "AR-M", name: "Mendoza", center: { lat: -32.89, lng: -68.83 } },
  { code: "AR-N", name: "Misiones", center: { lat: -27.37, lng: -55.9 } },
  { code: "AR-Q", name: "Neuquén", center: { lat: -38.95, lng: -68.06 } },
  { code: "AR-R", name: "Río Negro", center: { lat: -40.81, lng: -63.0 } },
  { code: "AR-A", name: "Salta", center: { lat: -24.78, lng: -65.41 } },
  { code: "AR-J", name: "San Juan", center: { lat: -31.54, lng: -68.52 } },
  { code: "AR-D", name: "San Luis", center: { lat: -33.3, lng: -66.34 } },
  { code: "AR-Z", name: "Santa Cruz", center: { lat: -48.62, lng: -69.22 } },
  { code: "AR-S", name: "Santa Fe", center: { lat: -31.63, lng: -60.7 } },
  { code: "AR-G", name: "Santiago del Estero", center: { lat: -27.78, lng: -64.26 } },
  { code: "AR-V", name: "Tierra del Fuego", center: { lat: -54.8, lng: -68.3 } },
  { code: "AR-T", name: "Tucumán", center: { lat: -26.82, lng: -65.22 } },
];

export const DEFAULT_PROVINCE_CODE = "AR-F";

const byCode = new Map(ARGENTINA_PROVINCES.map((p) => [p.code, p]));
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

export function getProvinceByCode(code) {
  return byCode.get(code) ?? null;
}

export function getProvinceByName(name) {
  return byNameNorm.get(normalizeProvinceName(name)) ?? null;
}

export function resolveProvinceCode({ province_code, province }) {
  if (province_code && byCode.has(province_code)) return province_code;
  const fromName = getProvinceByName(province);
  return fromName?.code ?? null;
}

export function getProvinceName(code) {
  return getProvinceByCode(code)?.name ?? code;
}
