import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format";
import "./PropertyCarousel.css";

const TYPE_LABELS = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local_comercial: "Local comercial",
};
const OP_LABELS = { venta: "Venta", alquiler: "Alquiler" };

/**
 * Card única para propiedades destacadas (carousel en landing).
 * Misma estructura visual en todas las cards. Soporta publicaciones reales y placeholders (espacios listos).
 * @param {Object} listing - Publicación (id, title, property_type, operation, city, address, rooms, area_sqm, price, images)
 * @param {Function} onSelect - Al hacer clic en publicación real, se llama con listing.id (abre modal)
 * @param {boolean} isPlaceholder - Si es true, la card es un espacio listo (id < 0); el CTA lleva a /propiedades
 */
export default function FeaturedPropertyCard({ listing, onSelect, isPlaceholder }) {
  if (!listing) return null;

  const typeLabel = TYPE_LABELS[listing.property_type] || listing.property_type;
  const opLabel = OP_LABELS[listing.operation] || listing.operation;
  const location =
    [listing.city, listing.address]
      .filter(Boolean)
      .join(listing.city && listing.address ? ", " : "") || "La Rioja";
  const price = formatPrice(listing.price, listing.currency);
  const rooms = listing.rooms != null ? `${listing.rooms} amb.` : "—";
  const area = `${listing.area_sqm} m²`;
  const coveredArea =
    listing.covered_area_sqm != null ? `Cubierta ${listing.covered_area_sqm} m²` : null;
  const imageUrl = listing.images?.[0];

  const handleClick = (e) => {
    e.preventDefault();
    if (!isPlaceholder) onSelect?.(listing.id);
  };

  return (
    <article className="property-card featured-property-card">
      {isPlaceholder ? (
        <Link
          to="/propiedades"
          className="featured-property-card__image-wrap"
          aria-label={`Ver publicaciones: ${listing.title}`}
        >
          <div className="property-card__image img-placeholder">
            <span>Sin imagen</span>
          </div>
        </Link>
      ) : (
        <button
          type="button"
          className="featured-property-card__image-wrap"
          onClick={handleClick}
          aria-label={`Ver detalle de ${listing.title}`}
        >
          <div className="property-card__image img-placeholder">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="property-card__img"
                width="800"
                height="600"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span>Sin imagen</span>
            )}
          </div>
        </button>
      )}
      <div className="property-card__content">
        {listing.featured && <span className="property-card__featured-badge">★ Destacada</span>}
        <span className="property-card__type">
          {typeLabel} · {opLabel}
        </span>
        <h3 className="property-card__title">
          {isPlaceholder ? (
            <Link to="/propiedades" className="featured-property-card__title-btn">
              {listing.title}
            </Link>
          ) : (
            <button
              type="button"
              className="featured-property-card__title-btn"
              onClick={handleClick}
            >
              {listing.title}
            </button>
          )}
        </h3>
        <p className="property-card__location">{location}</p>
        <ul className="property-card__meta" role="list">
          <li>{rooms}</li>
          <li>{area}</li>
          {coveredArea && <li>{coveredArea}</li>}
          {listing.has_balcony && <li>Balcón</li>}
        </ul>
        <p className="property-card__price">
          {listing.price != null ? (
            price
          ) : (
            <button
              type="button"
              className="property-card__price-action"
              onClick={handleClick}
              aria-label="Consultar esta propiedad"
            >
              Consultar
            </button>
          )}
        </p>
        {isPlaceholder ? (
          <Link to="/propiedades" className="btn btn-outline property-card__cta">
            Consultar
          </Link>
        ) : (
          <button
            type="button"
            className="btn btn-primary property-card__cta"
            onClick={handleClick}
          >
            Ver detalle y consultar
          </button>
        )}
      </div>
    </article>
  );
}
