import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getPublicListing } from "../api/client";
import { formatPrice } from "../utils/format";
import "./PropertyDetailPage.css";

const TYPE_LABELS = { casa: "Casa", departamento: "Departamento", terreno: "Terreno" };
const OP_LABELS = { venta: "Venta", alquiler: "Alquiler" };

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    getPublicListing(id)
      .then((data) => {
        setListing(data);
        document.title = `${data.title} | LRV Inmobiliaria`;
        const desc = data.description || data.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", desc.slice(0, 160));
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute("content", data.title);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute("content", desc.slice(0, 160));
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && data.images?.[0]) ogImage.setAttribute("content", data.images[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    return () => {
      document.title = "LRV Inmobiliaria";
    };
  }, [id]);

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${listing?.title || ""} - ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareUrl = () => {
    if (navigator.share) {
      navigator
        .share({
          title: listing?.title,
          text: listing?.description?.slice(0, 100),
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado");
    }
  };

  const images = listing?.images?.length ? listing.images : [];
  const mapUrl =
    listing?.lat != null && listing?.lng != null
      ? `https://www.google.com/maps?q=${listing.lat},${listing.lng}&output=embed`
      : null;

  if (loading) {
    return (
      <>
        <Header />
        <main className="detail-page">
          <div className="container">
            <div className="detail-page__skeleton" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <Header />
        <main className="detail-page">
          <div className="container">
            <p className="detail-page__error">{error || "Propiedad no encontrada."}</p>
            <Link to="/propiedades" className="btn btn-primary">
              Ver todas las propiedades
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="detail-page">
        <div className="container">
          <div className="detail-page__head">
            <span className="detail-page__badge">
              {TYPE_LABELS[listing.property_type]} · {OP_LABELS[listing.operation]}
            </span>
            <h1 className="detail-page__title">{listing.title}</h1>
            <p className="detail-page__location">
              {[listing.city, listing.address].filter(Boolean).join(" — ")}
            </p>
            <p className="detail-page__price">{formatPrice(listing.price)}</p>
          </div>

          <section className="detail-page__gallery">
            {images.length > 0 ? (
              <div className="detail-page__gallery-grid">
                {images.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    className="detail-page__gallery-item"
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
            ) : (
              <div className="detail-page__gallery-placeholder">Sin imágenes</div>
            )}
          </section>

          {lightboxIndex != null && images[lightboxIndex] && (
            <div
              className="detail-page__lightbox"
              role="dialog"
              aria-modal="true"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                type="button"
                className="detail-page__lightbox-close"
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

          <div className="detail-page__actions">
            <Link to="/#contacto" className="btn btn-primary">
              Contactar
            </Link>
            <Link to={`/propiedades/${id}/solicitar-visita`} className="btn btn-outline">
              Solicitar visita
            </Link>
            <button type="button" className="btn btn-outline" onClick={shareWhatsApp}>
              Compartir por WhatsApp
            </button>
            <button type="button" className="btn btn-outline" onClick={shareUrl}>
              Compartir enlace
            </button>
          </div>

          <section className="detail-page__info">
            <h2>Características</h2>
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
                <h3>Documentación</h3>
                <p>{listing.documentation}</p>
              </>
            )}
            {listing.description && (
              <>
                <h3>Descripción</h3>
                <p className="detail-page__description">{listing.description}</p>
              </>
            )}
          </section>

          {mapUrl && (
            <section className="detail-page__map">
              <h2>Ubicación</h2>
              <iframe
                title="Mapa de ubicación"
                src={mapUrl}
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: "var(--radius)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </section>
          )}

          <p className="detail-page__back">
            <Link to="/propiedades">← Volver al listado</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
