export const POLYGON_STORAGE_KEY = "lrv_search_polygon";
const MIN_VERTICES = 3;

function isValidRing(ring) {
  if (!Array.isArray(ring) || ring.length < MIN_VERTICES) return false;
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) return false;
    const lng = Number(pt[0]);
    const lat = Number(pt[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  }
  return true;
}

function normalizeRing(ring) {
  if (!isValidRing(ring)) return null;
  const normalized = ring.map((pt) => [Number(pt[0]), Number(pt[1])]);
  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    normalized.push([first[0], first[1]]);
  }
  return normalized;
}

export function saveSearchPolygon(ring) {
  const normalized = normalizeRing(ring);
  if (!normalized) return false;
  try {
    sessionStorage.setItem(POLYGON_STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function loadSearchPolygon() {
  try {
    const raw = sessionStorage.getItem(POLYGON_STORAGE_KEY);
    if (!raw) return null;
    return normalizeRing(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearSearchPolygon() {
  try {
    sessionStorage.removeItem(POLYGON_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function ringEquals(a, b) {
  if (!a && !b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((pt, i) => pt[0] === b[i][0] && pt[1] === b[i][1]);
}

export function isValidPolygonRing(ring) {
  return normalizeRing(ring) != null;
}
