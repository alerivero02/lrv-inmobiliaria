/**
 * Formatea un precio para visualización (separador de miles con puntos, ej: 50.000.000).
 * @param {number|null|undefined} price - Precio numérico
 * @returns {string} "$1.234.567" o "Consultar" si no hay precio
 */
export function formatPrice(price) {
  if (price == null || price === "" || Number.isNaN(Number(price))) return "Consultar";
  return `$${Number(price).toLocaleString("es-AR")}`;
}
