import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getListing,
  createListing,
  updateListing,
  uploadListingImages,
  resolveImageUrl,
  isUnsupportedRemoteImageUrl,
} from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  ARGENTINA_PROVINCES,
  CITIES_LA_RIOJA,
  PROPERTY_TYPES,
  STATUS_OPTIONS,
  OPERATION_OPTIONS,
} from "../../data/cities";
import MapPicker from "../../components/MapPicker";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminSurface } from "../../components/admin/AdminSurface";
import "./ListingFormPage.css";

function filterImageFiles(fileList) {
  return [...fileList].filter(
    (f) =>
      (f.type && f.type.startsWith("image/")) ||
      /\.(jpe?g|png|gif|webp|heic)$/i.test(f.name),
  );
}

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
  has_patio: false,
  has_balcony: false,
  has_quincho: false,
  has_terrace: false,
  garage_count: null,
  covered_area_sqm: "",
  featured: false,
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
            has_patio: data.has_patio ?? false,
            has_balcony: data.has_balcony ?? false,
            has_quincho: data.has_quincho ?? false,
            has_terrace: data.has_terrace ?? false,
            garage_count: data.garage_count ?? null,
            covered_area_sqm: data.covered_area_sqm ?? "",
            featured: data.featured ?? false,
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
  const [dropHighlight, setDropHighlight] = useState(false);
  const fileInputRef = useRef(null);

  const uploadFilesList = useCallback(
    async (rawFiles) => {
      const files = filterImageFiles(rawFiles);
      if (!files.length) {
        toast.show("No hay imágenes válidas (JPG, PNG, WebP, HEIC…)", "error");
        return;
      }
      setUploadingImages(true);
      try {
        const urls = await uploadListingImages(files);
        setForm((f) => ({ ...f, images: [...(f.images || []), ...urls] }));
        toast.show(`${urls.length} foto(s) agregada(s)`);
      } catch (err) {
        toast.show(err?.message || "Error al subir imágenes", "error");
      } finally {
        setUploadingImages(false);
      }
    },
    [toast],
  );

  const handleImageFiles = useCallback(
    async (e) => {
      const files = e.target.files ? [...e.target.files] : [];
      e.target.value = "";
      if (!files.length) return;
      await uploadFilesList(files);
    },
    [uploadFilesList],
  );

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
  const handleThumbDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) e.dataTransfer.dropEffect = "copy";
    else e.dataTransfer.dropEffect = "move";
  };

  const handleThumbDrop = (e, toIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      void uploadFilesList([...files]);
      setDraggedIndex(null);
      return;
    }
    if (draggedIndex != null) {
      moveImage(draggedIndex, toIndex);
      setDraggedIndex(null);
    }
  };

  const handleDropZoneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
      setDropHighlight(true);
    }
  };

  const handleDropZoneDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropHighlight(false);
  };

  const handleDropZoneDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropHighlight(false);
    const files = e.dataTransfer.files ? [...e.dataTransfer.files] : [];
    if (files.length) void uploadFilesList(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const cleanedImages = (form.images || [])
      .map((img) => (typeof img === "string" ? img.trim() : ""))
      .filter(Boolean)
      .filter((img) => !isUnsupportedRemoteImageUrl(img));

    const droppedImageCount = (form.images || []).length - cleanedImages.length;
    if (droppedImageCount > 0) {
      toast.show(
        `${droppedImageCount} imagen(es) fueron omitidas porque su CDN no permite mostrarlas fuera de Instagram/Facebook.`,
        "error",
      );
    }

    const payload = {
      ...form,
      city: citySource === "manual" ? form.location_manual || form.city : form.city,
      location_manual: citySource === "manual" ? form.location_manual || form.city : null,
      area_sqm: Number(form.area_sqm) || 0,
      covered_area_sqm:
        form.covered_area_sqm === "" || form.covered_area_sqm == null
          ? null
          : Number(form.covered_area_sqm),
      price: form.price === "" || form.price == null ? null : Number(form.price),
      rooms: form.rooms === "" || form.rooms == null ? null : Number(form.rooms),
      garage_count:
        form.has_garage && form.garage_count !== "" && form.garage_count != null
          ? Number(form.garage_count)
          : null,
      operation: form.operation || "venta",
      documentation: form.documentation || null,
      images: cleanedImages.length ? cleanedImages : null,
    };
    if (!payload.city) {
      setError("Indicá la ubicación (ciudad o localidad).");
      setLoading(false);
      return;
    }
    if (!payload.province) {
      setError("Seleccioná la provincia.");
      setLoading(false);
      return;
    }
    if (payload.price == null || Number.isNaN(payload.price)) {
      setError("Ingresá un precio válido.");
      setLoading(false);
      return;
    }
    if (!payload.currency) {
      setError("Seleccioná la moneda.");
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
      <AdminPageHeader
        title={isEdit ? "Editar anuncio" : "Nuevo anuncio"}
        subtitle="Completá la ficha con datos de ubicación, características, comisiones e imágenes."
        actions={
          <Link to="/admin" className="btn btn-outline">
            Volver
          </Link>
        }
      />

      <AdminSurface>
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
              Superficie cubierta (m²)
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.covered_area_sqm ?? ""}
                onChange={(e) => update("covered_area_sqm", e.target.value)}
                placeholder="Ej: 85"
              />
            </label>
          </div>
          <div className="listing-form__toggle-grid">
            {[
              ["has_garage", "Garaje"],
              ["has_garden", "Jardín"],
              ["has_pool", "Pileta"],
              ["has_patio", "Patio"],
              ["has_balcony", "Balcón"],
              ["has_quincho", "Quincho / Asador"],
              ["has_terrace", "Terraza"],
            ].map(([key, label]) => (
              <label key={key} className="listing-form__toggle">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => update(key, e.target.checked)}
                />
              </label>
            ))}
          </div>
          {form.has_garage && (
            <label>
              Cantidad de garages
              <input
                type="number"
                min={1}
                step={1}
                value={form.garage_count ?? ""}
                onChange={(e) => update("garage_count", e.target.value === "" ? null : e.target.value)}
                placeholder="Ej: 2"
              />
            </label>
          )}
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
          <h2>Precio</h2>
          <div className="listing-form__row">
            <label>
              Precio *
              <input
                type="number"
                min={0}
                step={1}
                value={form.price ?? ""}
                onChange={(e) => update("price", e.target.value === "" ? null : e.target.value)}
                required
                placeholder="Ej: 125000"
              />
            </label>
            <label>
              Moneda *
              <select
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
                required
              >
                <option value="ARS">ARS (Pesos argentinos)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </label>
            <label className="listing-form__toggle">
              <span>Destacado en landing</span>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update("featured", e.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="listing-form__section">
          <h2>Imágenes</h2>
          <p className="listing-form__hint">
            Arrastrá archivos a la zona punteada o usá el botón. En las miniaturas, arrastrá para
            reordenar. También podés pegar URLs abajo.
          </p>
          <input
            ref={fileInputRef}
            id="listing-images-input"
            className="listing-form__file-input-hidden"
            type="file"
            accept=".jpg,.jpeg,.png,.heic,.webp,image/*"
            multiple
            onChange={handleImageFiles}
            disabled={uploadingImages}
          />
          <div
            className={`listing-form__dropzone ${dropHighlight ? "listing-form__dropzone--active" : ""}`}
            onDragEnter={handleDropZoneDragOver}
            onDragOver={handleDropZoneDragOver}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={handleDropZoneDrop}
          >
            <div className="listing-form__dropzone-inner">
              <span className="listing-form__dropzone-icon" aria-hidden>
                ⬆
              </span>
              <p className="listing-form__dropzone-text">
                <strong>Soltá las fotos acá</strong> o elegí las fotos desde tu equipo
              </p>
              <button
                type="button"
                className="btn btn-primary listing-form__pick-btn"
                disabled={uploadingImages}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImages ? "Subiendo…" : "Elegir fotos"}
              </button>
            </div>
          </div>
          <div className="listing-form__images">
            {(form.images || []).map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="listing-form__image-item"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleThumbDragOver}
                onDrop={(e) => handleThumbDrop(e, index)}
                onDragEnd={() => setDraggedIndex(null)}
              >
                <img
                  src={resolveImageUrl(url)}
                  alt=""
                  className="listing-form__image-preview"
                  loading="lazy"
                  decoding="async"
                />
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
            onAdd={(url) => {
              if (isUnsupportedRemoteImageUrl(url)) {
                toast.show(
                  "Esa URL de imagen está bloqueada por su proveedor (Instagram/Facebook CDN). Subí la foto al sistema o usá otra URL pública estable.",
                  "error",
                );
                return;
              }
              setForm((f) => ({ ...f, images: [...(f.images || []), url] }));
            }}
          />
        </div>

        <div className="listing-form__section">
          <h2>Ubicación</h2>
          <p className="listing-form__hint">
            Esta sección queda al final para confirmar dirección exacta y pin en mapa.
          </p>
          <div className="listing-form__row">
            <label>
              Provincia *
              <select
                value={form.province}
                onChange={(e) => update("province", e.target.value)}
                required
              >
                <option value="">Seleccionar provincia...</option>
                {ARGENTINA_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
              <strong>Ubicación en el mapa</strong> — Buscá la dirección, hacé clic en el mapa o
              arrastrá el pin para ajustar la posición.
            </p>
            <MapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(nextLat, nextLng) => {
                update("lat", nextLat);
                update("lng", nextLng);
              }}
              onAddressSelect={({ address, city, province }) => {
                if (address) update("address", address);
                if (city) {
                  update("city", city);
                  update("location_manual", city);
                  setCitySource("manual");
                }
                if (province && ARGENTINA_PROVINCES.includes(province)) {
                  update("province", province);
                }
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

        <div className="listing-form__actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear anuncio"}
          </button>
          <Link to="/admin" className="btn btn-outline">
            Cancelar
          </Link>
        </div>
        </form>
      </AdminSurface>
    </div>
  );
}
