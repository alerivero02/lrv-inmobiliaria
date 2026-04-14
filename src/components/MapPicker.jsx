import { useMemo, useRef, useState } from "react";
import { GoogleMap, MarkerF, StandaloneSearchBox, useJsApiLoader } from "@react-google-maps/api";
import {
  Box,
  Alert,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";

const LA_RIOJA_CENTER = { lat: -29.41, lng: -66.85 };
const mapContainerStyle = { width: "100%", height: "100%" };
const libraries = ["places"];

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

export default function MapPicker({ lat, lng, onChange, onAddressSelect }) {
  const [searchError, setSearchError] = useState("");
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "listing-google-map-script",
    googleMapsApiKey,
    libraries,
    language: "es",
    region: "AR",
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
    const places = searchBoxRef.current?.getPlaces?.() || [];
    if (!places.length || !places[0].geometry?.location) {
      setSearchError("No se pudo geocodificar la dirección seleccionada.");
      return;
    }
    setSearchError("");
    const place = places[0];
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

  if (!googleMapsApiKey) {
    return (
      <Alert severity="warning">
        Configurá `VITE_GOOGLE_MAPS_API_KEY` para habilitar mapa, marcador draggable y autocompletado.
      </Alert>
    );
  }

  if (loadError) {
    return <Alert severity="error">No se pudo cargar Google Maps. Verificá la API key y permisos.</Alert>;
  }

  if (!isLoaded) {
    return <Typography variant="body2">Cargando Google Maps…</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
        <StandaloneSearchBox
          onLoad={(ref) => {
            searchBoxRef.current = ref;
          }}
          onPlacesChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Buscar dirección (ej: Rivadavia 100, La Rioja)"
            className="listing-form__google-search"
          />
        </StandaloneSearchBox>
      </Box>
      {searchError && (
        <Typography color="error" variant="caption" sx={{ mb: 1, display: "block" }}>
          {searchError}
        </Typography>
      )}

      {position && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <MyLocationIcon sx={{ fontSize: 14 }} />
          {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          &nbsp;·&nbsp;Arrastrá el marcador o hacé clic para reubicar
        </Typography>
      )}
      {!position && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Hacé clic en el mapa para seleccionar la ubicación
        </Typography>
      )}

      <Box
        sx={{
          height: 380,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
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
    </Box>
  );
}
