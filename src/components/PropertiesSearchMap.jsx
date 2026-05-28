import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DrawingManager,
  GoogleMap,
  MarkerF,
  OverlayView,
  useJsApiLoader,
} from "@react-google-maps/api";
import { getGoogleMapsApiKey, getSharedGoogleMapsLoaderOptions } from "../config/googleMaps";
import { getProvinceByCode } from "../data/provinces";
import PropertyMapPopover from "./PropertyMapPopover";
import { pathToPolygonRing } from "../utils/polygonRing";
import "./PropertiesSearchMap.css";

const mapContainerStyle = { width: "100%", height: "100%" };

function PropertiesSearchMapInner({
  provinceCode,
  mapPins,
  polygon,
  onPolygonChange,
  onPolygonComplete,
  onPinHover,
  onPinOpen,
  hoveredId,
  variant = "search",
  compact = false,
}) {
  const mapRef = useRef(null);
  const polygonOverlayRef = useRef(null);
  const listenersBoundOverlayRef = useRef(null);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [drawingReady, setDrawingReady] = useState(false);

  const center = useMemo(() => {
    const prov = getProvinceByCode(provinceCode);
    return prov?.center ?? { lat: -29.41, lng: -66.85 };
  }, [provinceCode]);

  const drawingOptions = useMemo(() => {
    if (!drawingReady || !window.google?.maps?.drawing) return null;
    return {
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: "#9a7b4f",
        fillOpacity: 0.18,
        strokeWeight: 2,
        strokeColor: "#6b5340",
        editable: true,
        clickable: true,
      },
    };
  }, [drawingReady]);

  const emitRingFromOverlay = useCallback(
    (overlay) => {
      const ring = pathToPolygonRing(overlay.getPath());
      if (ring) onPolygonChange?.(ring);
      return ring;
    },
    [onPolygonChange],
  );

  const bindOverlayListeners = useCallback(
    (overlay) => {
      if (listenersBoundOverlayRef.current === overlay) return;
      listenersBoundOverlayRef.current = overlay;
      const path = overlay.getPath();
      const push = () => emitRingFromOverlay(overlay);
      path.addListener("set_at", push);
      path.addListener("insert_at", push);
      path.addListener("remove_at", push);
    },
    [emitRingFromOverlay],
  );

  const clearDrawnPolygon = useCallback(() => {
    listenersBoundOverlayRef.current = null;
    if (polygonOverlayRef.current) {
      polygonOverlayRef.current.setMap(null);
      polygonOverlayRef.current = null;
    }
    onPolygonChange?.(null);
  }, [onPolygonChange]);

  const handleRedraw = useCallback(() => {
    clearDrawnPolygon();
  }, [clearDrawnPolygon]);

  const handlePolygonComplete = useCallback(
    (poly) => {
      if (polygonOverlayRef.current && polygonOverlayRef.current !== poly) {
        polygonOverlayRef.current.setMap(null);
      }
      listenersBoundOverlayRef.current = null;
      polygonOverlayRef.current = poly;
      bindOverlayListeners(poly);
      const ring = emitRingFromOverlay(poly);
      if (ring) onPolygonComplete?.(ring);
    },
    [bindOverlayListeners, emitRingFromOverlay, onPolygonComplete],
  );

  useEffect(() => {
    if (!polygon?.length) {
      if (polygonOverlayRef.current) {
        polygonOverlayRef.current.setMap(null);
        polygonOverlayRef.current = null;
        listenersBoundOverlayRef.current = null;
      }
      return;
    }
    if (!mapRef.current || !window.google?.maps) return;
    if (polygonOverlayRef.current) return;

    const paths = polygon.map(([lng, lat]) => ({ lat, lng }));
    const overlay = new window.google.maps.Polygon({
      paths,
      fillColor: "#9a7b4f",
      fillOpacity: 0.18,
      strokeWeight: 2,
      strokeColor: "#6b5340",
      editable: true,
      map: mapRef.current,
    });
    polygonOverlayRef.current = overlay;
    bindOverlayListeners(overlay);
    emitRingFromOverlay(overlay);
  }, [polygon, bindOverlayListeners, emitRingFromOverlay]);

  useEffect(() => {
    if (!mapRef.current) return;
    const prov = getProvinceByCode(provinceCode);
    if (prov?.center && !polygon?.length) {
      mapRef.current.panTo(prov.center);
      mapRef.current.setZoom(9);
    }
  }, [provinceCode, polygon]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    if (polygon?.length >= 3) {
      const bounds = new window.google.maps.LatLngBounds();
      for (const [lng, lat] of polygon) {
        bounds.extend({ lat: Number(lat), lng: Number(lng) });
      }
      mapRef.current.fitBounds(bounds, 48);
      return;
    }

    if (!mapPins?.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    let has = false;
    for (const p of mapPins) {
      if (p.lat == null || p.lng == null) continue;
      bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) });
      has = true;
    }
    if (has) mapRef.current.fitBounds(bounds, 48);
  }, [mapPins, polygon]);

  const activeHover =
    hoveredPin ?? mapPins?.find((p) => p.id === hoveredId) ?? null;

  const hintText =
    variant === "landing"
      ? "Seleccioná el ícono de polígono arriba, dibujá el área y cerrá haciendo clic en el primer punto"
      : "Dibujá un área en el mapa para ver solo las propiedades dentro";

  const rootClass = ["search-map", compact && "search-map--compact"].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <div className="search-map__toolbar">
        <span className="search-map__hint">{hintText}</span>
        <div className="search-map__actions">
          {polygon?.length > 0 && (
            <>
              <button type="button" className="search-map__clear" onClick={handleRedraw}>
                Dibujar de nuevo
              </button>
              <button type="button" className="search-map__clear" onClick={clearDrawnPolygon}>
                Borrar área
              </button>
            </>
          )}
        </div>
      </div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={11}
        onLoad={(map) => {
          mapRef.current = map;
          setDrawingReady(true);
        }}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {drawingOptions && (
          <DrawingManager
            drawingMode={polygon?.length ? null : window.google.maps.drawing.OverlayType.POLYGON}
            options={drawingOptions}
            onPolygonComplete={handlePolygonComplete}
          />
        )}

        {mapPins?.map((pin) => {
          if (pin.lat == null || pin.lng == null) return null;
          const pos = { lat: Number(pin.lat), lng: Number(pin.lng) };
          const isActive = activeHover?.id === pin.id;
          return (
            <MarkerF
              key={pin.id}
              position={pos}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: isActive ? 11 : 8,
                fillColor: isActive ? "#6b5340" : "#9a7b4f",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
              }}
              zIndex={isActive ? 1000 : 1}
              onMouseOver={() => {
                setHoveredPin(pin);
                onPinHover?.(pin.id);
              }}
              onMouseOut={() => {
                setHoveredPin(null);
                onPinHover?.(null);
              }}
              onClick={() => onPinOpen?.(pin.id)}
            />
          );
        })}

        {activeHover?.lat != null && activeHover?.lng != null && (
          <OverlayView
            position={{ lat: Number(activeHover.lat), lng: Number(activeHover.lng) }}
            mapPaneName={OverlayView.FLOAT_PANE}
            getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h - 14 })}
          >
            <PropertyMapPopover listing={activeHover} onOpen={onPinOpen} />
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  );
}

export default function PropertiesSearchMap(props) {
  const apiKey = getGoogleMapsApiKey();
  const { isLoaded, loadError } = useJsApiLoader({
    ...getSharedGoogleMapsLoaderOptions(),
    googleMapsApiKey: apiKey,
  });

  if (!apiKey) {
    return (
      <div className="search-map search-map--placeholder">
        <p>
          Configurá <code>VITE_GOOGLE_MAPS_API_KEY</code> para usar el mapa interactivo.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="search-map search-map--placeholder">
        <p>No se pudo cargar Google Maps.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="search-map search-map--placeholder">
        <p>Cargando mapa…</p>
      </div>
    );
  }

  return <PropertiesSearchMapInner {...props} />;
}
