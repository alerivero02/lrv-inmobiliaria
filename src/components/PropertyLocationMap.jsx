import { useCallback, useEffect, useMemo, useRef } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { getGoogleMapsApiKey, getSharedGoogleMapsLoaderOptions } from "../config/googleMaps";

const MAP_STYLE = { width: "100%", height: "100%" };

function PropertyLocationMapInner({ lat, lng, googleMapsApiKey }) {
  const position = useMemo(() => ({ lat: Number(lat), lng: Number(lng) }), [lat, lng]);
  const wrapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    ...getSharedGoogleMapsLoaderOptions(),
    googleMapsApiKey,
  });

  const resizeAndRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps?.event) return;
    window.google.maps.event.trigger(map, "resize");
    map.setCenter(position);
  }, [position]);

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

  if (loadError) {
    return <p className="property-detail-modal__map-fallback">No se pudo cargar el mapa.</p>;
  }

  if (!isLoaded) {
    return <p className="property-detail-modal__map-fallback">Cargando mapa…</p>;
  }

  return (
    <div ref={wrapRef} className="property-detail-modal__map-canvas">
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={position}
        zoom={15}
        onLoad={onMapLoad}
        options={{
          gestureHandling: "cooperative",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        <MarkerF position={position} />
      </GoogleMap>
    </div>
  );
}

export default function PropertyLocationMap({ lat, lng }) {
  const googleMapsApiKey = getGoogleMapsApiKey();
  if (!googleMapsApiKey) {
    return (
      <p className="property-detail-modal__map-fallback">
        Ubicación aproximada: usá “Abrir en Google Maps” debajo.
      </p>
    );
  }
  return (
    <PropertyLocationMapInner lat={lat} lng={lng} googleMapsApiKey={googleMapsApiKey} />
  );
}
