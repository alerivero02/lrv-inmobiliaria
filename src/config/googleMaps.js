/** Mismo `id` en todo el sitio para que useJsApiLoader no inyecte el script de Maps dos veces. */
export const LRV_GOOGLE_MAPS_SCRIPT_ID = "lrv-google-maps-script";

/** Array estable (referencia fija) para evitar warnings de recarga en useJsApiLoader. */
export const LRV_GOOGLE_MAPS_LIBRARIES = ["places", "geometry"];

/** Oculta POIs ajenos (negocios, etc.) y desactiva su click/hover. */
export const LRV_MAP_BASE_OPTIONS = {
  clickableIcons: false,
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  ],
};

export function getGoogleMapsApiKey() {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
}

/** Campos compartidos entre MapPicker (admin) y mapas de solo lectura (landing / modal). */
export function getSharedGoogleMapsLoaderOptions() {
  return {
    id: LRV_GOOGLE_MAPS_SCRIPT_ID,
    libraries: LRV_GOOGLE_MAPS_LIBRARIES,
    language: "es",
    region: "AR",
  };
}

/** Merge de opciones de mapa con la base anti-POI. */
export function mergeMapOptions(local = {}) {
  return { ...LRV_MAP_BASE_OPTIONS, ...local };
}
