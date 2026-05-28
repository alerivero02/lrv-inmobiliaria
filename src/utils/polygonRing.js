/** Convierte path de Google Maps a anillo [[lng, lat], ...] cerrado. */
export function pathToPolygonRing(path) {
  const ring = path.getArray().map((ll) => [ll.lng(), ll.lat()]);
  if (ring.length < 3) return null;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  return ring;
}

/** Anillo sin vértice de cierre duplicado. */
export function openPolygonRing(ring) {
  if (!ring?.length) return [];
  const pts = [...ring];
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) pts.pop();
  return pts;
}

/** Para `<Polygon paths={...} />` de react-google-maps. */
export function ringToLatLngPaths(ring) {
  return openPolygonRing(ring).map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }));
}

/** Centroide simple (promedio de vértices). */
export function polygonCentroid(ring) {
  const pts = openPolygonRing(ring);
  if (!pts.length) return null;
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of pts) {
    sumLng += lng;
    sumLat += lat;
  }
  return { lat: sumLat / pts.length, lng: sumLng / pts.length };
}

/** Área en m² con google.maps.geometry.spherical.computeArea. */
export function computeRingAreaSqm(ring) {
  if (!ring?.length || !window.google?.maps?.geometry?.spherical) return null;
  const paths = ringToLatLngPaths(ring);
  if (paths.length < 3) return null;
  const area = window.google.maps.geometry.spherical.computeArea(paths);
  return Number.isFinite(area) ? Math.round(area * 100) / 100 : null;
}
