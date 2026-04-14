import { useMemo, useRef, useState } from "react";
import { Autocomplete, GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import {
  Box,
  Alert,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { getGoogleMapsApiKey, getSharedGoogleMapsLoaderOptions } from "../config/googleMaps";

const LA_RIOJA_CENTER = { lat: -29.41, lng: -66.85 };
const mapContainerStyle = { width: "100%", height: "100%" };

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

/**
 * Solo monta el hook de carga cuando ya hay API key (evita script sin `key` y el warning NoApiKeys).
 */
function MapPickerWithKey({ googleMapsApiKey, lat, lng, onChange, onAddressSelect }) {
  const [searchError, setSearchError] = useState("");
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const { isLoaded, loadError } = useJsApiLoader({
    ...getSharedGoogleMapsLoaderOptions(),
    googleMapsApiKey,
  });
  const geocoder = useMemo(
    () => (isLoaded && window.google?.maps ? new window.google.maps.Geocoder() : null),
    [isLoaded],
  );

  const hasPosition = lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const position = hasPosition ? { lat: Number(lat), lng: Number(lng) } : null;

  const geocodePosition = (nextLat, nextLng) => {
    if (!geocoder || !onAddressSelect) return;
    geocoder.geocode({ location: { lat: nextLat, lng: nextLng } }, (results, status) => {
      if (status !== "OK" || !results?.[0]) return;
      const components = parseAddressComponents(results[0].address_components || []);
      onAddressSelect({
        address: results[0].formatted_address || "",
        city: components.city,
        province: components.province,
      });
    });
  };

  const updatePosition = (newLat, newLng) => {
    onChange(newLat, newLng);
    geocodePosition(newLat, newLng);
  };

  const handlePlaceChanged = () => {
    const ac = autocompleteRef.current;
    const place = ac?.getPlace?.();
    if (!place?.geometry?.location) {
      setSearchError("No se pudo geocodificar la dirección seleccionada.");
      return;
    }
    setSearchError("");
    const nextLat = place.geometry.location.lat();
    const nextLng = place.geometry.location.lng();
    onChange(nextLat, nextLng);
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

  if (loadError) {
    return <Alert severity="error">No se pudo cargar Google Maps. Verificá la API key y permisos.</Alert>;
  }

  if (!isLoaded) {
    return <Typography variant="body2">Cargando Google Maps…</Typography>;
  }

  return (
    <Box>
      <Box
        sx={{
          height: 380,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          position: "relative",
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={position ?? LA_RIOJA_CENTER}
          zoom={position ? 15 : 6}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          onClick={(e) => {
            const nextLat = e.latLng?.lat();
            const nextLng = e.latLng?.lng();
            if (nextLat == null || nextLng == null) return;
            updatePosition(nextLat, nextLng);
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
                placeholder="Buscar dirección (ej: Rivadavia 100, La Rioja)"
                className="listing-form__google-search"
              />
            </Autocomplete>
          </Box>
          {position && (
            <MarkerF
              position={position}
              draggable
              onDragEnd={(e) => {
                const nextLat = e.latLng?.lat();
                const nextLng = e.latLng?.lng();
                if (nextLat == null || nextLng == null) return;
                updatePosition(nextLat, nextLng);
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

      {position && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <MyLocationIcon sx={{ fontSize: 14 }} />
          {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          &nbsp;·&nbsp;Arrastrá el marcador o hacé clic para reubicar
        </Typography>
      )}
      {!position && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Hacé clic en el mapa para seleccionar la ubicación
        </Typography>
      )}
    </Box>
  );
}

export default function MapPicker(props) {
  const googleMapsApiKey = getGoogleMapsApiKey();

  if (!googleMapsApiKey) {
    return (
      <Alert severity="warning">
        Configurá `VITE_GOOGLE_MAPS_API_KEY` para habilitar mapa, marcador draggable y autocompletado.
      </Alert>
    );
  }

  return <MapPickerWithKey googleMapsApiKey={googleMapsApiKey} {...props} />;
}
