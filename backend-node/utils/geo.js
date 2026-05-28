const MAX_POLYGON_VERTICES = 200;
const MIN_POLYGON_VERTICES = 3;

/**
 * Ray-casting: punto [lng, lat] dentro de polígono [[lng,lat], ...].
 * Compatible con SQLite y PostgreSQL sin PostGIS.
 */
export function pointInPolygon(lng, lat, ring) {
  if (!ring || ring.length < MIN_POLYGON_VERTICES) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Parsea `polygon` del query: JSON [[lng,lat],...] o GeoJSON Polygon.
 */
export function parsePolygonQuery(raw) {
  if (!raw || typeof raw !== "string") return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  let ring = null;
  if (Array.isArray(parsed?.coordinates?.[0])) {
    ring = parsed.coordinates[0];
  } else if (Array.isArray(parsed)) {
    ring = parsed;
  }
  if (!Array.isArray(ring) || ring.length < MIN_POLYGON_VERTICES) return null;
  if (ring.length > MAX_POLYGON_VERTICES) return null;

  const normalized = [];
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const lng = Number(pt[0]);
    const lat = Number(pt[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    normalized.push([lng, lat]);
  }

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    normalized.push([first[0], first[1]]);
  }

  return normalized;
}

export function filterRowsByPolygon(rows, polygon) {
  if (!polygon?.length) return rows;
  return rows.filter(
    (row) =>
      row.lat != null &&
      row.lng != null &&
      pointInPolygon(Number(row.lng), Number(row.lat), polygon),
  );
}
