/**
 * Formatea un precio para visualización (separador de miles con puntos, ej: 50.000.000).
 * @param {number|null|undefined} price - Precio numérico
 * @param {"ARS"|"USD"|string} currency - Moneda
 * @returns {string} "$1.234.567" o "Consultar" si no hay precio
 */
export function formatPrice(price, currency = "ARS") {
  if (price == null || price === "" || Number.isNaN(Number(price))) return "Consultar";
  const symbol = currency === "USD" ? "US$" : "$";
  return `${symbol}${Number(price).toLocaleString("es-AR")}`;
}
