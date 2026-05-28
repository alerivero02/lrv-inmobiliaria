import { formatPrice } from "../utils/format";
import { TYPE_LABELS } from "../data/propertyTypes";
import "./PropertyMapPopover.css";

const OP_LABELS = { venta: "Venta", alquiler: "Alquiler" };

/** Tooltip flotante al hacer hover sobre un pin del mapa de búsqueda. */
export default function PropertyMapPopover({ listing, onOpen }) {
  if (!listing) return null;

  const price = formatPrice(listing.price, listing.currency);
  const rooms = listing.rooms != null ? `${listing.rooms} amb.` : null;
  const area = listing.area_sqm != null ? `${listing.area_sqm} m²` : null;
  const typeLabel = TYPE_LABELS[listing.property_type] || listing.property_type;
  const opLabel = OP_LABELS[listing.operation] || listing.operation;

  return (
    <button
      type="button"
      className="map-popover"
      onClick={() => onOpen?.(listing.id)}
      aria-label={`Ver ${listing.title}`}
    >
      <div className="map-popover__image">
        {listing.image ? (
          <img src={listing.image} alt="" width={240} height={140} loading="lazy" />
        ) : (
          <span className="map-popover__placeholder">Sin imagen</span>
        )}
      </div>
      <div className="map-popover__body">
        <p className="map-popover__price">{price}</p>
        <p className="map-popover__meta">
          {[rooms, area].filter(Boolean).join(" · ") || typeLabel}
        </p>
        <p className="map-popover__type">
          {typeLabel} · {opLabel}
        </p>
      </div>
    </button>
  );
}
