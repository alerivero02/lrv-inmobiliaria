import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getListing, createListing, updateListing, uploadListingImages } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  CITIES_LA_RIOJA,
  PROPERTY_TYPES,
  STATUS_OPTIONS,
  OPERATION_OPTIONS,
} from "../../data/cities";
import MapPicker from "../../components/MapPicker";
import "leaflet/dist/leaflet.css";
import "./ListingFormPage.css";

function AddImageUrl({ onAdd }) {
  const [url, setUrl] = useState("");
  const add = () => {
    const v = url.trim();
    if (v) {
      onAdd(v);
      setUrl("");
    }
  };
  return (
    <label className="listing-form__url-add">
      Agregar URL de imagen
      <div className="listing-form__url-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="https://ejemplo.com/foto.jpg"
        />
        <button type="button" className="btn btn-outline" onClick={add}>
          Agregar
        </button>
      </div>
    </label>
  );
}

const emptyForm = {
  title: "",
  description: "",
  property_type: "casa",
  status: "active",
  operation: "venta",
  documentation: "",
  address: "",
  city: "",
  province: "La Rioja",
  lat: null,
  lng: null,
  location_manual: "",
  rooms: null,
  area_sqm: "",
  price: null,
  currency: "ARS",
  has_garage: false,
  has_garden: false,
  has_pool: false,
  extras_note: "",
  images: [],
};

export default function ListingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [citySource, setCitySource] = useState("list"); // 'list' | 'manual'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getListing(id)
      .then((data) => {
        if (!cancelled) {
          setForm({
            title: data.title ?? "",
            description: data.description ?? "",
            property_type: data.property_type ?? "casa",
            status: data.status ?? "active",
            operation: data.operation ?? "venta",
            documentation: data.documentation ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            province: data.province ?? "La Rioja",
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            location_manual: data.location_manual ?? "",
            rooms: data.rooms ?? null,
            area_sqm: data.area_sqm ?? "",
            price: data.price ?? null,
            currency: data.currency ?? "ARS",
            has_garage: data.has_garage ?? false,
            has_garden: data.has_garden ?? false,
            has_pool: data.has_pool ?? false,
            extras_note: data.extras_note ?? "",
            images: Array.isArray(data.images) ? data.images : [],
          });
          setCitySource(data.city && CITIES_LA_RIOJA.includes(data.city) ? "list" : "manual");
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const [uploadingImages, setUploadingImages] = useState(false);
  const handleImageFiles = useCallback(async (e) => {
    const files = e.target.files ? [...e.target.files] : [];
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const urls = await uploadListingImages(files);
      setForm((f) => ({ ...f, images: [...(f.images || []), ...urls] }));
    } catch (_) {}
    setUploadingImages(false);
    e.target.value = "";
  }, []);

  const moveImage = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setForm((f) => {
      const imgs = [...(f.images || [])];
      const [removed] = imgs.splice(fromIndex, 1);
      imgs.splice(toIndex, 0, removed);
      return { ...f, images: imgs };
    });
  };

  const removeImage = (index) => {
    setForm((f) => ({
      ...f,
      images: (f.images || []).filter((_, i) => i !== index),
    }));
  };

  const [draggedIndex, setDraggedIndex] = useState(null);
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    if (draggedIndex != null) {
      moveImage(draggedIndex, toIndex);
      setDraggedIndex(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      ...form,
      city: citySource === "manual" ? form.location_manual || form.city : form.city,
      location_manual: citySource === "manual" ? form.location_manual || form.city : null,
      area_sqm: Number(form.area_sqm) || 0,
      price: form.price === "" || form.price == null ? null : Number(form.price),
      rooms: form.rooms === "" || form.rooms == null ? null : Number(form.rooms),
      operation: form.operation || "venta",
      documentation: form.documentation || null,
      images: form.images && form.images.length ? form.images : null,
    };
    if (!payload.city) {
      setError("Indicá la ubicación (ciudad o localidad).");
      setLoading(false);
      return;
    }
    try {
      if (isEdit) {
        await updateListing(id, payload);
        toast.show("Anuncio actualizado correctamente");
        navigate("/admin");
      } else {
        await createListing(payload);
        toast.show("Anuncio creado correctamente");
        navigate("/admin");
      }
    } catch (err) {
      setError(err.message || "Error al guardar");
      toast.show(err.message || "Error al guardar", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isEdit && loadError) {
    return (
      <div className="listing-form-page">
        <p className="listing-form-page__error">{loadError}</p>
        <Link to="/admin">Volver a anuncios</Link>
      </div>
    );
  }

  return (
    <div className="listing-form-page">
      <header className="listing-form-page__header">
        <h1>{isEdit ? "Editar anuncio" : "Nuevo anuncio"}</h1>
        <Link to="/admin" className="btn btn-outline">
          Volver
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="listing-form">
        {error && <p className="listing-form__error">{error}</p>}

        <div className="listing-form__section">
          <h2>Información básica</h2>
          <label>
            Título *
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              maxLength={200}
              placeholder="Ej: Casa amplia en zona residencial"
            />
          </label>
          <label>
            Descripción
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              placeholder="Descripción detallada del inmueble..."
            />
          </label>
          <div className="listing-form__row">
            <label>
              Tipo de inmueble *
              <select
                value={form.property_type}
                onChange={(e) => update("property_type", e.target.value)}
                required
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Operación
              <select value={form.operation} onChange={(e) => update("operation", e.target.value)}>
                {OPERATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Documentación del inmueble
            <textarea
              value={form.documentation}
              onChange={(e) => update("documentation", e.target.value)}
              rows={2}
              placeholder="Ej: Escritura, planos, expensas..."
            />
          </label>
        </div>

        <div className="listing-form__section">
          <h2>Ubicación</h2>
          <p className="listing-form__hint">
            Elegí una localidad de la lista o insertá una manualmente.
          </p>
          <div className="listing-form__radio-group">
            <label className="listing-form__radio">
              <input
                type="radio"
                name="citySource"
                checked={citySource === "list"}
                onChange={() => setCitySource("list")}
              />
              Elegir del listado
            </label>
            <label className="listing-form__radio">
              <input
                type="radio"
                name="citySource"
                checked={citySource === "manual"}
                onChange={() => setCitySource("manual")}
              />
              Escribir manualmente
            </label>
          </div>
          {citySource === "list" ? (
            <label>
              Localidad *
              <select value={form.city} onChange={(e) => update("city", e.target.value)} required>
                <option value="">Seleccionar...</option>
                {[...new Set(CITIES_LA_RIOJA)].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Localidad / dirección (manual) *
              <input
                type="text"
                value={form.location_manual || form.city}
                onChange={(e) => {
                  update("location_manual", e.target.value);
                  update("city", e.target.value);
                }}
                placeholder="Ej: La Rioja Capital, Barrio Sur"
                required
              />
            </label>
          )}
          <label>
            Dirección (calle y número)
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Ej: Av. San Martín 123"
            />
          </label>
          <div className="listing-form__map-section">
            <p className="listing-form__hint" style={{ marginBottom: 8 }}>
              <strong>Ubicación en el mapa</strong> (opcional) — Buscá la dirección o hacé clic para
              marcar la posición exacta
            </p>
            <MapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(lat, lng) => {
                update("lat", lat);
                update("lng", lng);
              }}
            />
            <div className="listing-form__row" style={{ marginTop: 8 }}>
              <label>
                Latitud
                <input
                  type="number"
                  step="any"
                  value={form.lat ?? ""}
                  onChange={(e) =>
                    update("lat", e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder="-29.4131"
                />
              </label>
              <label>
                Longitud
                <input
                  type="number"
                  step="any"
                  value={form.lng ?? ""}
                  onChange={(e) =>
                    update("lng", e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder="-66.8556"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="listing-form__section">
          <h2>Características</h2>
          <div className="listing-form__row">
            <label>
              Ambientes
              <input
                type="number"
                min={0}
                max={50}
                value={form.rooms ?? ""}
                onChange={(e) =>
                  update("rooms", e.target.value === "" ? null : parseInt(e.target.value, 10))
                }
                placeholder="Ej: 3"
              />
            </label>
            <label>
              Superficie (m²) *
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.area_sqm}
                onChange={(e) => update("area_sqm", e.target.value)}
                required
                placeholder="Ej: 120"
              />
            </label>
            <label>
              Precio (dejar vacío = Consultar)
              <input
                type="number"
                min={0}
                step={1}
                value={form.price ?? ""}
                onChange={(e) => update("price", e.target.value === "" ? null : e.target.value)}
                placeholder="Consultar"
              />
            </label>
          </div>
          <div className="listing-form__checkboxes">
            <label className="listing-form__checkbox">
              <input
                type="checkbox"
                checked={form.has_garage}
                onChange={(e) => update("has_garage", e.target.checked)}
              />
              Garaje
            </label>
            <label className="listing-form__checkbox">
              <input
                type="checkbox"
                checked={form.has_garden}
                onChange={(e) => update("has_garden", e.target.checked)}
              />
              Jardín
            </label>
            <label className="listing-form__checkbox">
              <input
                type="checkbox"
                checked={form.has_pool}
                onChange={(e) => update("has_pool", e.target.checked)}
              />
              Pileta
            </label>
          </div>
          <label>
            Notas extras (comodidades, etc.)
            <input
              type="text"
              value={form.extras_note}
              onChange={(e) => update("extras_note", e.target.value)}
              placeholder="Ej: Aire acondicionado, calefacción..."
            />
          </label>
        </div>

        <div className="listing-form__section">
          <h2>Imágenes</h2>
          <p className="listing-form__hint">
            Subí fotos (JPG, PNG, HEIC) o arrastrá para reordenar. Podés seguir agregando URLs
            manualmente abajo.
          </p>
          <label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.heic,.webp"
              multiple
              onChange={handleImageFiles}
              disabled={uploadingImages}
            />
            {uploadingImages && <span className="listing-form__uploading">Subiendo…</span>}
          </label>
          <div className="listing-form__images">
            {(form.images || []).map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="listing-form__image-item"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => setDraggedIndex(null)}
              >
                <img src={url} alt="" className="listing-form__image-preview" />
                <span className="listing-form__image-order">{index + 1}</span>
                <button
                  type="button"
                  className="listing-form__image-remove"
                  onClick={() => removeImage(index)}
                  aria-label="Quitar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <AddImageUrl
            onAdd={(url) => setForm((f) => ({ ...f, images: [...(f.images || []), url] }))}
          />
        </div>

        <div className="listing-form__actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear anuncio"}
          </button>
          <Link to="/admin" className="btn btn-outline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
