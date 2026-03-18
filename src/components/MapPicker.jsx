/**
 * MapPicker — Selector de ubicación con react-leaflet
 * Click en el mapa actualiza lat/lng. Marcador arrastrable.
 * Buscador de dirección con Nominatim (sin API key).
 */
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MyLocationIcon from "@mui/icons-material/MyLocation";

// Fix leaflet default marker icon (broken in vite/webpack builds)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const LA_RIOJA_CENTER = [-29.41, -66.85];

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ lat, lng, onChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const markerRef = useRef(null);
  const mapRef = useRef(null);

  const hasPosition = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  const position = hasPosition ? [Number(lat), Number(lng)] : null;

  const handleMapClick = (newLat, newLng) => {
    onChange(newLat, newLng);
  };

  const handleDragEnd = () => {
    if (markerRef.current) {
      const latlng = markerRef.current.getLatLng();
      onChange(latlng.lat, latlng.lng);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=ar`;
      const res = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = await res.json();
      if (!data.length) {
        setSearchError("No se encontró la dirección.");
        return;
      }
      const { lat: foundLat, lon: foundLng } = data[0];
      const newLat = parseFloat(foundLat);
      const newLng = parseFloat(foundLng);
      onChange(newLat, newLng);
      if (mapRef.current) {
        mapRef.current.flyTo([newLat, newLng], 16);
      }
    } catch {
      setSearchError("Error al buscar. Verificá tu conexión.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (mapRef.current && position) {
      mapRef.current.flyTo(position, mapRef.current.getZoom() < 14 ? 15 : mapRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <Box>
      {/* Search bar */}
      <Box component="form" onSubmit={handleSearch} sx={{ display: "flex", gap: 1, mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar dirección (ej: Rivadavia 100, La Rioja)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="outlined" disabled={searching} sx={{ minWidth: 100 }}>
          {searching ? <CircularProgress size={18} /> : "Buscar"}
        </Button>
      </Box>
      {searchError && (
        <Typography color="error" variant="caption" sx={{ mb: 1, display: "block" }}>
          {searchError}
        </Typography>
      )}

      {/* Coordenadas actuales */}
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

      {/* Map */}
      <Box
        sx={{
          height: 380,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <MapContainer
          center={position ?? LA_RIOJA_CENTER}
          zoom={position ? 15 : 13}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {position && (
            <Marker
              position={position}
              draggable
              ref={markerRef}
              eventHandlers={{ dragend: handleDragEnd }}
            />
          )}
        </MapContainer>
      </Box>
    </Box>
  );
}
