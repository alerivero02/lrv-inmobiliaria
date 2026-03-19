import { useState, useEffect } from "react";
import { getPublicListing } from "../api/client";
import { formatPrice } from "../utils/format";
import VisitRequestForm from "./VisitRequestForm";
import "./PropertyDetailModal.css";

const TYPE_LABELS = { casa: "Casa", departamento: "Departamento", terreno: "Terreno" };
const OP_LABELS = { venta: "Venta", alquiler: "Alquiler" };

const minDate = new Date();
minDate.setDate(minDate.getDate() + 2);
const minDateStr = minDate.toISOString().slice(0, 10);

/** Número de WhatsApp de la agencia (con código de país, sin +). Configurar en VITE_AGENCY_WHATSAPP */
const AGENCY_WHATSAPP = import.meta.env.VITE_AGENCY_WHATSAPP || "5493804123456";

/** URL base del sitio para enlaces en WhatsApp. Configurar en VITE_SITE_URL (ej: https://tudominio.com) */
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://www.ejemplo.com").replace(/\/$/, "");

/** Arma un mensaje con formato tipo card: tipo • operación, título, ubicación, características, precio y link para preview con imagen */
function buildWhatsAppUrl(listing) {
  if (!listing) return "#";
  const typeLabel = (TYPE_LABELS[listing.property_type] || listing.property_type).toUpperCase();
  const opLabel = (OP_LABELS[listing.operation] || listing.operation).toUpperCase();
  const location = [listing.city, listing.address].filter(Boolean).join(", ") || "La Rioja";
  const rooms = listing.rooms != null ? `${listing.rooms} amb.` : "—";
  const area = `${listing.area_sqm} m²`;
  const price = formatPrice(listing.price);
  const propertyUrl = `${SITE_URL}/propiedades/${listing.id}`;

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
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [consultSuccess, setConsultSuccess] = useState(false);

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
    const onEscape = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const images = listing?.images?.length ? listing.images : [];
  const mapUrl =
    listing?.lat != null && listing?.lng != null
      ? `https://www.google.com/maps?q=${listing.lat},${listing.lng}&output=embed`
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

            {images.length > 0 && (
              <div className="property-detail-modal__gallery">
                {images.slice(0, 6).map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    className="property-detail-modal__gallery-item"
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img
                      src={url}
                      alt=""
                      width="800"
                      height="600"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
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

            {mapUrl && (
              <section className="property-detail-modal__map">
                <h3>Ubicación</h3>
                <iframe
                  title="Mapa"
                  src={mapUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: "var(--radius)" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
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

        {lightboxIndex != null && images[lightboxIndex] && (
          <div
            className="property-detail-modal__lightbox"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              className="property-detail-modal__lightbox-close"
              onClick={() => setLightboxIndex(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <img
              src={images[lightboxIndex]}
              alt=""
              width="1200"
              height="900"
              loading="eager"
              decoding="async"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
