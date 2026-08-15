import { useEffect } from "react";
import {
  ARGENTINA_PROVINCES,
  CITIES_LA_RIOJA,
  OPERATION_OPTIONS,
  PROPERTY_TYPES,
  INVESTMENT_TAGS,
} from "../data/cities";
import "./PropertiesFilterSheet.css";

function FilterField({ label, children }) {
  return (
    <label className="pfs-field">
      <span className="pfs-field__label">{label}</span>
      {children}
    </label>
  );
}

/**
 * Panel lateral de filtros para móvil (/propiedades).
 */
export default function PropertiesFilterSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  onApply,
  onClear,
  activeCount = 0,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const set = (patch) => onChange((f) => ({ ...f, ...patch }));

  return (
    <div className="pfs-root" role="presentation">
      <button
        type="button"
        className="pfs-backdrop"
        aria-label="Cerrar filtros"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="pfs-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pfs-title"
      >
        <header className="pfs-header">
          <h2 id="pfs-title" className="pfs-title">
            Filtros
            {activeCount > 0 ? (
              <span className="pfs-title__badge">{activeCount}</span>
            ) : null}
          </h2>
          <button
            type="button"
            className="pfs-close"
            aria-label="Cerrar"
            onClick={() => onOpenChange(false)}
          >
            ×
          </button>
        </header>

        <div className="pfs-body">
          <FilterField label="Buscar">
            <input
              type="text"
              className="pfs-input"
              placeholder="Título o ciudad..."
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
            />
          </FilterField>

          <FilterField label="Provincia">
            <select
              className="pfs-select"
              value={filters.province_code}
              onChange={(e) => set({ province_code: e.target.value })}
            >
              {ARGENTINA_PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Tipo de inmueble">
            <select
              className="pfs-select"
              value={filters.property_type}
              onChange={(e) => set({ property_type: e.target.value })}
            >
              <option value="">Todos</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Inversión">
            <select
              className="pfs-select"
              value={filters.investment_tag}
              onChange={(e) => set({ investment_tag: e.target.value })}
            >
              <option value="">Todas</option>
              {INVESTMENT_TAGS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Operación">
            <select
              className="pfs-select"
              value={filters.operation}
              onChange={(e) => set({ operation: e.target.value })}
            >
              <option value="">Venta y alquiler</option>
              {OPERATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Localidad">
            <select
              className="pfs-select"
              value={filters.city}
              onChange={(e) => set({ city: e.target.value })}
            >
              <option value="">Todas</option>
              {[...new Set(CITIES_LA_RIOJA)].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterField>

          <div className="pfs-row">
            <FilterField label="Precio mín.">
              <input
                type="number"
                className="pfs-input"
                placeholder="$ mín"
                min={0}
                value={filters.min_price}
                onChange={(e) => set({ min_price: e.target.value })}
              />
            </FilterField>
            <FilterField label="Precio máx.">
              <input
                type="number"
                className="pfs-input"
                placeholder="$ máx"
                min={0}
                value={filters.max_price}
                onChange={(e) => set({ max_price: e.target.value })}
              />
            </FilterField>
          </div>

          <div className="pfs-row">
            <FilterField label="Ambientes mín.">
              <input
                type="number"
                className="pfs-input"
                placeholder="Ej: 3"
                min={0}
                value={filters.min_rooms}
                onChange={(e) => set({ min_rooms: e.target.value })}
              />
            </FilterField>
            <FilterField label="Superficie mín. (m²)">
              <input
                type="number"
                className="pfs-input"
                placeholder="Ej: 80"
                min={0}
                value={filters.min_area}
                onChange={(e) => set({ min_area: e.target.value })}
              />
            </FilterField>
          </div>

          <fieldset className="pfs-amenities">
            <legend className="pfs-field__label">Comodidades</legend>
            <div className="pfs-checks">
              <label className="pfs-check">
                <input
                  type="checkbox"
                  checked={filters.has_garage}
                  onChange={(e) => set({ has_garage: e.target.checked })}
                />
                Garaje
              </label>
              <label className="pfs-check">
                <input
                  type="checkbox"
                  checked={filters.has_garden}
                  onChange={(e) => set({ has_garden: e.target.checked })}
                />
                Jardín
              </label>
              <label className="pfs-check">
                <input
                  type="checkbox"
                  checked={filters.has_pool}
                  onChange={(e) => set({ has_pool: e.target.checked })}
                />
                Pileta
              </label>
            </div>
          </fieldset>
        </div>

        <footer className="pfs-footer">
          <button type="button" className="pfs-btn pfs-btn--ghost" onClick={onClear}>
            Limpiar
          </button>
          <button
            type="button"
            className="pfs-btn pfs-btn--primary"
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
          >
            Ver resultados
          </button>
        </footer>
      </div>
    </div>
  );
}
