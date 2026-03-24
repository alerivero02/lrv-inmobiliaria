import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getPublicListing } from "../api/client";
import { formatPrice } from "../utils/format";
import { ensureLeafletDefaultIcon } from "../utils/leafletDefaultIcon";
import VisitRequestForm from "./VisitRequestForm";
import { AGENCY_WHATSAPP, getSiteBaseUrl } from "../config/agency";
import "./PropertyDetailModal.css";

ensureLeafletDefaultIcon();

const TYPE_LABELS = { casa: "Casa", departamento: "Departamento", terreno: "Terreno" };
const OP_LABELS = { venta: "Venta", alquiler: "Alquiler" };

/** Ajusta el mapa al tamaño real del contenedor sin setTimeout (evita violaciones de rendimiento en DevTools). */
function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    let rafId = 0;
    const scheduleInvalidate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
      });
    };

    const ro = new ResizeObserver(scheduleInvalidate);
    ro.observe(container);
    scheduleInvalidate();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [map]);
  return null;
}

/** Arma un mensaje con formato tipo card: tipo • operación, título, ubicación, características, precio y link para preview con imagen */
function buildWhatsAppUrl(listing) {
  if (!listing) return "#";
  const typeLabel = (TYPE_LABELS[listing.property_type] || listing.property_type).toUpperCase();
  const opLabel = (OP_LABELS[listing.operation] || listing.operation).toUpperCase();
  const location = [listing.city, listing.address].filter(Boolean).join(", ") || "La Rioja";
  const rooms = listing.rooms != null ? `${listing.rooms} amb.` : "—";
  const area = `${listing.area_sqm} m²`;
  const price = formatPrice(listing.price);
  const base = getSiteBaseUrl();
  const propertyUrl = base ? `${base}/propiedades/${listing.id}` : `/propiedades/${listing.id}`;

  const lines = [
    "🏠 _Consulta por publicación_",
    "",
    `*${typeLabel} • ${opLabel}*`,
    `*${listing.title}*`,
    location,
    `${rooms} · ${area}`,
    `*${price}*`,
    "",
    "─────────────────",
    "¿Podrían darme más información? Gracias.",
  ];
  if (propertyUrl) lines.push("", propertyUrl);

  const text = lines.join("\n");
  return `https://wa.me/${AGENCY_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export default function PropertyDetailModal({ listingId, onClose }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState(false);
  const swipeRef = useRef({ x: 0, y: 0, tracking: false });

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    setError("");
    getPublicListing(listingId)
      .then(setListing)
      .catch((err) => setError(err.message || "Error al cargar"))
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(() => {
    setImageIndex(0);
    setLightboxOpen(false);
  }, [listingId]);

  const images = listing?.images?.length ? listing.images : [];
  const nImages = images.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (lightboxOpen) {
          e.preventDefault();
          setLightboxOpen(false);
        } else {
          onClose();
        }
        return;
      }
      if (!nImages) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setImageIndex((i) => (i - 1 + nImages) % nImages);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setImageIndex((i) => (i + 1) % nImages);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, lightboxOpen, nImages]);

  const touchStart = (e) => {
    swipeRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      tracking: true,
    };
  };

  const touchEnd = (e) => {
    if (!nImages || !swipeRef.current.tracking) return;
    swipeRef.current.tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeRef.current.x;
    const dy = t.clientY - swipeRef.current.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) setImageIndex((i) => (i + 1) % nImages);
      else setImageIndex((i) => (i - 1 + nImages) % nImages);
    }
  };

  const hasMapCoords = listing?.lat != null && listing?.lng != null;
  const googleMapsLink = hasMapCoords
    ? `https://www.google.com/maps?q=${listing.lat},${listing.lng}`
    : null;

  return (
    <div
      className="property-detail-modal__backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-detail-modal-title"
    >
      <div className="property-detail-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="property-detail-modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        {loading && <div className="property-detail-modal__loading">Cargando…</div>}

        {error && (
          <div className="property-detail-modal__error">
            <p>{error}</p>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}

        {!loading && !error && listing && (
          <div className="property-detail-modal__body">
            <div className="property-detail-modal__head">
              <span className="property-detail-modal__badge">
                {TYPE_LABELS[listing.property_type]} · {OP_LABELS[listing.operation]}
              </span>
              <h2 id="property-detail-modal-title" className="property-detail-modal__title">
                {listing.title}
              </h2>
              <p className="property-detail-modal__location">
                {[listing.city, listing.address].filter(Boolean).join(" — ")}
              </p>
              <p className="property-detail-modal__price">{formatPrice(listing.price)}</p>
            </div>

            {nImages > 0 && (
              <div className="property-detail-modal__gallery-block">
                <div
                  className="property-detail-modal__carousel"
                  onTouchStart={touchStart}
                  onTouchEnd={touchEnd}
                >
                  <button
                    type="button"
                    className="property-detail-modal__carousel-nav property-detail-modal__carousel-nav--prev"
                    onClick={() => setImageIndex((i) => (i - 1 + nImages) % nImages)}
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="property-detail-modal__carousel-main"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={images[imageIndex]}
                      alt=""
                      width="900"
                      height="600"
                      loading="eager"
                      decoding="async"
                    />
                    <span className="property-detail-modal__carousel-counter" aria-live="polite">
                      {imageIndex + 1} / {nImages}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="property-detail-modal__carousel-nav property-detail-modal__carousel-nav--next"
                    onClick={() => setImageIndex((i) => (i + 1) % nImages)}
                    aria-label="Imagen siguiente"
                  >
                    ›
                  </button>
                </div>
                <p className="property-detail-modal__carousel-hint">
                  Deslizá en la imagen o usá las flechas para ver más. Clic para ampliar.
                </p>
                <div className="property-detail-modal__thumbs" role="tablist" aria-label="Miniaturas">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === imageIndex}
                      className={
                        i === imageIndex
                          ? "property-detail-modal__thumb property-detail-modal__thumb--active"
                          : "property-detail-modal__thumb"
                      }
                      onClick={() => setImageIndex(i)}
                    >
                      <img src={url} alt="" width="120" height="90" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <section className="property-detail-modal__info">
              <h3>Características</h3>
              <ul>
                <li>
                  <strong>Superficie:</strong> {listing.area_sqm} m²
                </li>
                {listing.rooms != null && (
                  <li>
                    <strong>Ambientes:</strong> {listing.rooms}
                  </li>
                )}
                <li>
                  <strong>Precio:</strong> {formatPrice(listing.price)}
                </li>
                {listing.has_garage && <li>Garaje</li>}
                {listing.has_garden && <li>Jardín</li>}
                {listing.has_pool && <li>Pileta</li>}
                {listing.extras_note && <li>{listing.extras_note}</li>}
              </ul>
              {listing.documentation && (
                <>
                  <h4>Documentación</h4>
                  <p>{listing.documentation}</p>
                </>
              )}
              {listing.description && (
                <>
                  <h4>Descripción</h4>
                  <p className="property-detail-modal__description">{listing.description}</p>
                </>
              )}
            </section>

            {hasMapCoords && (
              <section className="property-detail-modal__map">
                <h3>Ubicación</h3>
                <div className="property-detail-modal__map-wrap">
                  <MapContainer
                    key={`${listing.id}-${listing.lat}-${listing.lng}`}
                    center={[listing.lat, listing.lng]}
                    zoom={15}
                    className="property-detail-modal__map-leaflet"
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[listing.lat, listing.lng]} />
                    <MapInvalidateSize />
                  </MapContainer>
                </div>
                {googleMapsLink && (
                  <a
                    className="property-detail-modal__map-link"
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir en Google Maps
                  </a>
                )}
              </section>
            )}

            <section className="property-detail-modal__consult">
              <h3>Consultar esta propiedad</h3>
              <p className="property-detail-modal__consult-hint">
                Completá el formulario y te contactamos para coordinar la visita, o escribinos por
                WhatsApp.
              </p>

              <a
                href={buildWhatsAppUrl(listing)}
                target="_blank"
                rel="noopener noreferrer"
                className="property-detail-modal__whatsapp"
                aria-label="Enviar mensaje por WhatsApp a la agencia"
              >
                <span className="property-detail-modal__whatsapp-icon" aria-hidden>
                  💬
                </span>
                Escribir por WhatsApp
              </a>

              <VisitRequestForm
                listingId={listingId}
                submitLabel="Enviar consulta"
                onSuccess={() => setConsultSuccess(true)}
              />
              {consultSuccess && (
                <div className="property-detail-modal__form-actions property-detail-modal__form-actions--after-success">
                  <button type="button" className="btn btn-primary" onClick={onClose}>
                    Cerrar
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {lightboxOpen && nImages > 0 && images[imageIndex] && (
          <div
            className="property-detail-modal__lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada de la imagen"
            onClick={() => setLightboxOpen(false)}
            onTouchStart={touchStart}
            onTouchEnd={touchEnd}
          >
            <button
              type="button"
              className="property-detail-modal__lightbox-close"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              aria-label="Cerrar"
            >
              ×
            </button>
            <button
              type="button"
              className="property-detail-modal__lightbox-nav property-detail-modal__lightbox-nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                setImageIndex((i) => (i - 1 + nImages) % nImages);
              }}
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="property-detail-modal__lightbox-nav property-detail-modal__lightbox-nav--next"
              onClick={(e) => {
                e.stopPropagation();
                setImageIndex((i) => (i + 1) % nImages);
              }}
              aria-label="Imagen siguiente"
            >
              ›
            </button>
            <img
              src={images[imageIndex]}
              alt=""
              width="1200"
              height="900"
              loading="eager"
              decoding="async"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="property-detail-modal__lightbox-counter" aria-live="polite">
              {imageIndex + 1} / {nImages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
