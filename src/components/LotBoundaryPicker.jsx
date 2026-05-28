import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  DrawingManager,
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Alert, Box, Typography } from "@mui/material";
import { getGoogleMapsApiKey, getSharedGoogleMapsLoaderOptions } from "../config/googleMaps";
import { getProvinceByCode } from "../data/provinces";
import {
  computeRingAreaSqm,
  pathToPolygonRing,
  polygonCentroid,
} from "../utils/polygonRing";
import "./LotBoundaryPicker.css";

const mapContainerStyle = { width: "100%", height: "100%" };
const LA_RIOJA_CENTER = { lat: -29.41, lng: -66.85 };

const POLYGON_STYLE = {
  fillColor: "#9a7b4f",
  fillOpacity: 0.22,
  strokeWeight: 2,
  strokeColor: "#6b5340",
  editable: true,
  clickable: true,
};

function parseAddressComponents(components = []) {
  const cityComponent = components.find((c) =>
    c.types.some((t) => ["locality", "administrative_area_level_2"].includes(t)),
  );
  const provinceComponent = components.find((c) => c.types.includes("administrative_area_level_1"));
  return {
    city: cityComponent?.long_name ?? null,
    province: provinceComponent?.long_name ?? null,
  };
}

function LotBoundaryPickerInner({
  googleMapsApiKey,
  provinceCode,
  polygon,
  lat,
  lng,
  onPolygonChange,
  onAreaComputed,
  onAddressSelect,
  onPositionChange,
}) {
  const mapRef = useRef(null);
  const polygonOverlayRef = useRef(null);
  const listenersBoundOverlayRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [drawingReady, setDrawingReady] = useState(false);
  const [searchError, setSearchError] = useState("");

  const center = useMemo(() => {
    const prov = getProvinceByCode(provinceCode);
    return prov?.center ?? LA_RIOJA_CENTER;
  }, [provinceCode]);

  const hasPin =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const pinPosition = hasPin ? { lat: Number(lat), lng: Number(lng) } : null;

  const drawingOptions = useMemo(() => {
    if (!drawingReady || !window.google?.maps?.drawing) return null;
    return {
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: POLYGON_STYLE,
    };
  }, [drawingReady]);

  const emitFromOverlay = useCallback(
    (overlay) => {
      const ring = pathToPolygonRing(overlay.getPath());
      if (!ring) {
        onPolygonChange?.(null);
        onAreaComputed?.(null);
        return null;
      }
      onPolygonChange?.(ring);
      const sqm = computeRingAreaSqm(ring);
      if (sqm != null) onAreaComputed?.(sqm);
      return ring;
    },
    [onPolygonChange, onAreaComputed],
  );

  const bindOverlayListeners = useCallback(
    (overlay) => {
      if (listenersBoundOverlayRef.current === overlay) return;
      listenersBoundOverlayRef.current = overlay;
      const path = overlay.getPath();
      const push = () => emitFromOverlay(overlay);
      path.addListener("set_at", push);
      path.addListener("insert_at", push);
      path.addListener("remove_at", push);
    },
    [emitFromOverlay],
  );

  const clearPolygon = useCallback(() => {
    listenersBoundOverlayRef.current = null;
    if (polygonOverlayRef.current) {
      polygonOverlayRef.current.setMap(null);
      polygonOverlayRef.current = null;
    }
    onPolygonChange?.(null);
    onAreaComputed?.(null);
  }, [onPolygonChange, onAreaComputed]);

  const handlePolygonComplete = useCallback(
    (poly) => {
      if (polygonOverlayRef.current && polygonOverlayRef.current !== poly) {
        polygonOverlayRef.current.setMap(null);
      }
      listenersBoundOverlayRef.current = null;
      polygonOverlayRef.current = poly;
      bindOverlayListeners(poly);
      const ring = emitFromOverlay(poly);
      if (ring && mapRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        for (const [ringLng, ringLat] of ring) {
          bounds.extend({ lat: ringLat, lng: ringLng });
        }
        mapRef.current.fitBounds(bounds, 48);
      }
    },
    [bindOverlayListeners, emitFromOverlay],
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

    const paths = polygon.map(([ringLng, ringLat]) => ({ lat: ringLat, lng: ringLng }));
    const overlay = new window.google.maps.Polygon({
      paths,
      ...POLYGON_STYLE,
      map: mapRef.current,
    });
    polygonOverlayRef.current = overlay;
    bindOverlayListeners(overlay);
  }, [polygon, bindOverlayListeners]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (polygon?.length >= 3) {
      const bounds = new window.google.maps.LatLngBounds();
      for (const [ringLng, ringLat] of polygon) {
        bounds.extend({ lat: Number(ringLat), lng: Number(ringLng) });
      }
      mapRef.current.fitBounds(bounds, 48);
      return;
    }
    if (pinPosition) {
      mapRef.current.panTo(pinPosition);
      mapRef.current.setZoom(16);
      return;
    }
    const prov = getProvinceByCode(provinceCode);
    if (prov?.center) {
      mapRef.current.panTo(prov.center);
      mapRef.current.setZoom(9);
    }
  }, [polygon, pinPosition, provinceCode]);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace?.();
    if (!place?.geometry?.location) {
      setSearchError("No se pudo geocodificar la dirección seleccionada.");
      return;
    }
    setSearchError("");
    const nextLat = place.geometry.location.lat();
    const nextLng = place.geometry.location.lng();
    onPositionChange?.(nextLat, nextLng);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: nextLat, lng: nextLng });
      mapRef.current.setZoom(16);
    }
    if (onAddressSelect) {
      const components = parseAddressComponents(place.address_components || []);
      onAddressSelect({
        address: place.formatted_address || "",
        city: components.city,
        province: components.province,
      });
    }
  };

  const computedArea = polygon?.length ? computeRingAreaSqm(polygon) : null;

  return (
    <Box className="lot-boundary-picker">
      <div className="lot-boundary-picker__toolbar">
        <span className="lot-boundary-picker__hint">
          Usá el ícono de polígono para dibujar el perímetro del lote. Podés editar los vértices
          después.
        </span>
        {polygon?.length > 0 && (
          <button type="button" className="lot-boundary-picker__clear" onClick={clearPolygon}>
            Borrar perímetro
          </button>
        )}
      </div>
      <Box
        className="lot-boundary-picker__map-wrap"
        sx={{
          height: 400,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          position: "relative",
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={pinPosition ?? center}
          zoom={pinPosition ? 16 : 9}
          onLoad={(map) => {
            mapRef.current = map;
            setDrawingReady(true);
          }}
          onClick={(e) => {
            const nextLat = e.latLng?.lat();
            const nextLng = e.latLng?.lng();
            if (nextLat == null || nextLng == null) return;
            onPositionChange?.(nextLat, nextLng);
          }}
          options={{
            mapTypeControl: true,
            mapTypeId: "hybrid",
            streetViewControl: false,
            fullscreenControl: true,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              right: 10,
              zIndex: 2,
            }}
          >
            <Autocomplete
              onLoad={(instance) => {
                autocompleteRef.current = instance;
              }}
              onPlaceChanged={handlePlaceChanged}
              options={{
                componentRestrictions: { country: "ar" },
                fields: ["formatted_address", "geometry", "address_components"],
              }}
            >
              <input
                type="text"
                placeholder="Buscar dirección para centrar el mapa"
                className="listing-form__google-search"
              />
            </Autocomplete>
          </Box>

          {drawingOptions && (
            <DrawingManager
              drawingMode={
                polygon?.length ? null : window.google.maps.drawing.OverlayType.POLYGON
              }
              options={drawingOptions}
              onPolygonComplete={handlePolygonComplete}
            />
          )}

          {pinPosition && (
            <MarkerF
              position={pinPosition}
              draggable
              onDragEnd={(e) => {
                const nextLat = e.latLng?.lat();
                const nextLng = e.latLng?.lng();
                if (nextLat == null || nextLng == null) return;
                onPositionChange?.(nextLat, nextLng);
              }}
            />
          )}
        </GoogleMap>
      </Box>
      {searchError && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
          {searchError}
        </Typography>
      )}
      {computedArea != null && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Superficie calculada del polígono: <strong>{computedArea.toLocaleString("es-AR")} m²</strong>
        </Typography>
      )}
      {polygon?.length >= 3 && !hasPin && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          Referencia en mapa: centro del polígono (
          {polygonCentroid(polygon)?.lat?.toFixed(5)}, {polygonCentroid(polygon)?.lng?.toFixed(5)})
        </Typography>
      )}
    </Box>
  );
}

export default function LotBoundaryPicker(props) {
  const googleMapsApiKey = getGoogleMapsApiKey();
  const { isLoaded, loadError } = useJsApiLoader({
    ...getSharedGoogleMapsLoaderOptions(),
    googleMapsApiKey,
  });

  if (!googleMapsApiKey) {
    return (
      <Alert severity="warning">
        Configurá `VITE_GOOGLE_MAPS_API_KEY` para dibujar el perímetro del lote en el mapa.
      </Alert>
    );
  }

  if (loadError) {
    return <Alert severity="error">No se pudo cargar Google Maps.</Alert>;
  }

  if (!isLoaded) {
    return <Typography variant="body2">Cargando mapa…</Typography>;
  }

  return <LotBoundaryPickerInner googleMapsApiKey={googleMapsApiKey} {...props} />;
}
