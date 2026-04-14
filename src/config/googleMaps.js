/** Mismo `id` en todo el sitio para que useJsApiLoader no inyecte el script de Maps dos veces. */
export const LRV_GOOGLE_MAPS_SCRIPT_ID = "lrv-google-maps-script";

/** Array estable (referencia fija) para evitar warnings de recarga en useJsApiLoader. */
export const LRV_GOOGLE_MAPS_LIBRARIES = ["places"];

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
