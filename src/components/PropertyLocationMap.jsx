import { useCallback, useEffect, useMemo, useRef } from "react";
import { GoogleMap, MarkerF, Polygon, useJsApiLoader } from "@react-google-maps/api";
import { getGoogleMapsApiKey, getSharedGoogleMapsLoaderOptions, mergeMapOptions } from "../config/googleMaps";
import { polygonCentroid, ringToLatLngPaths } from "../utils/polygonRing";

const MAP_STYLE = { width: "100%", height: "100%" };

const LOT_POLYGON_OPTIONS = {
  fillColor: "#9a7b4f",
  fillOpacity: 0.22,
  strokeWeight: 2,
  strokeColor: "#6b5340",
  clickable: false,
  editable: false,
};

function PropertyLocationMapInner({ lat, lng, lotPolygon, googleMapsApiKey }) {
  const hasPin =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const hasLotPolygon = Array.isArray(lotPolygon) && lotPolygon.length >= 3;

  const pinPosition = useMemo(() => {
    if (hasPin) return { lat: Number(lat), lng: Number(lng) };
    if (hasLotPolygon) {
      const c = polygonCentroid(lotPolygon);
      if (c) return c;
    }
    return null;
  }, [hasPin, hasLotPolygon, lat, lng, lotPolygon]);

  const polygonPaths = useMemo(
    () => (hasLotPolygon ? ringToLatLngPaths(lotPolygon) : []),
    [hasLotPolygon, lotPolygon],
  );

  const wrapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    ...getSharedGoogleMapsLoaderOptions(),
    googleMapsApiKey,
  });

  const fitMapToContent = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    if (hasLotPolygon && polygonPaths.length >= 3) {
      const bounds = new window.google.maps.LatLngBounds();
      for (const p of polygonPaths) {
        bounds.extend(p);
      }
      map.fitBounds(bounds, 40);
      return;
    }

    if (pinPosition) {
      map.setCenter(pinPosition);
      map.setZoom(15);
    }
  }, [hasLotPolygon, polygonPaths, pinPosition]);

  const resizeAndRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps?.event) return;
    window.google.maps.event.trigger(map, "resize");
    fitMapToContent();
  }, [fitMapToContent]);

  const onMapLoad = useCallback(
    (map) => {
      mapInstanceRef.current = map;
      requestAnimationFrame(() => {
        resizeAndRecenter();
      });
    },
    [resizeAndRecenter],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !isLoaded) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(resizeAndRecenter);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLoaded, resizeAndRecenter]);

  useEffect(() => {
    if (!isLoaded) return;
    fitMapToContent();
  }, [isLoaded, fitMapToContent, lotPolygon, lat, lng]);

  if (loadError) {
    return <p className="property-detail-modal__map-fallback">No se pudo cargar el mapa.</p>;
  }

  if (!isLoaded) {
    return <p className="property-detail-modal__map-fallback">Cargando mapa…</p>;
  }

  if (!pinPosition && !hasLotPolygon) {
    return (
      <p className="property-detail-modal__map-fallback">
        Ubicación aproximada: usá “Abrir en Google Maps” debajo.
      </p>
    );
  }

  return (
    <div ref={wrapRef} className="property-detail-modal__map-canvas">
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={pinPosition ?? { lat: -29.41, lng: -66.85 }}
        zoom={15}
        onLoad={onMapLoad}
        options={mergeMapOptions({
          gestureHandling: "cooperative",
          streetViewControl: false,
          mapTypeControl: true,
          mapTypeId: hasLotPolygon ? "hybrid" : "roadmap",
          fullscreenControl: true,
        })}
      >
        {hasLotPolygon && polygonPaths.length >= 3 && (
          <Polygon paths={polygonPaths} options={LOT_POLYGON_OPTIONS} />
        )}
        {pinPosition && <MarkerF position={pinPosition} />}
      </GoogleMap>
    </div>
  );
}

export default function PropertyLocationMap({ lat, lng, lotPolygon }) {
  const googleMapsApiKey = getGoogleMapsApiKey();
  if (!googleMapsApiKey) {
    return (
      <p className="property-detail-modal__map-fallback">
        Ubicación aproximada: usá “Abrir en Google Maps” debajo.
      </p>
    );
  }
  return (
    <PropertyLocationMapInner
      lat={lat}
      lng={lng}
      lotPolygon={lotPolygon}
      googleMapsApiKey={googleMapsApiKey}
    />
  );
}
