import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const PropertyDetailModal = lazy(() => import("../components/PropertyDetailModal"));
import FeaturedPropertyCard from "../components/FeaturedPropertyCard";
import { getPublicListings } from "../api/client";
import { CITIES_LA_RIOJA, PROPERTY_TYPES, OPERATION_OPTIONS } from "../data/cities";
import { useSeo } from "../hooks/useSeo";
import "./PropertiesPage.css";

const LIMIT = 12;
const INITIAL_FILTERS = {
  search: "",
  property_type: "",
  operation: "",
  city: "",
  min_price: "",
  max_price: "",
  min_rooms: "",
  min_area: "",
  has_garage: false,
  has_garden: false,
  has_pool: false,
};

export default function PropertiesPage() {
  useSeo({
    title: "Propiedades en venta y alquiler",
    description:
      "Catálogo LRV Inmobiliaria La Rioja: casas, departamentos, terrenos, fincas y campos en venta y alquiler. Buscá LRV o LRV Inmobiliaria.",
    canonicalPath: "/propiedades",
  });

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const ADVANCED_KEYS = [
    "min_price",
    "max_price",
    "min_rooms",
    "min_area",
    "has_garage",
    "has_garden",
    "has_pool",
  ];

  const hasActiveFilters = Object.keys(INITIAL_FILTERS).some((k) => {
    const v = filters[k];
    return typeof v === "boolean" ? v : v !== "";
  });
  const hasAdvancedActive = ADVANCED_KEYS.some((k) => {
    const v = filters[k];
    return typeof v === "boolean" ? v : v !== "";
  });

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const fetchPage = useCallback(
    async (pageNum, reset = false) => {
      setLoading(true);
      try {
        const params = { limit: LIMIT, page: pageNum };
        if (filters.search) params.search = filters.search;
        if (filters.property_type) params.property_type = filters.property_type;
        if (filters.operation) params.operation = filters.operation;
        if (filters.city) params.city = filters.city;
        if (filters.min_price) params.min_price = Number(filters.min_price);
        if (filters.max_price) params.max_price = Number(filters.max_price);
        if (filters.min_rooms) params.bedrooms = Number(filters.min_rooms);
        if (filters.min_area) params.min_area = Number(filters.min_area);
        if (filters.has_garage) params.has_garage = true;
        if (filters.has_garden) params.has_garden = true;
        if (filters.has_pool) params.has_pool = true;

        const data = await getPublicListings(params);
        const items = Array.isArray(data?.items) ? data.items : [];
        setListings((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(pageNum < (data?.pages || 1));
        setPage(pageNum);
      } catch (_) {
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [
    filters.search,
    filters.property_type,
    filters.operation,
    filters.city,
    filters.min_price,
    filters.max_price,
    filters.min_rooms,
    filters.min_area,
    filters.has_garage,
    filters.has_garden,
    filters.has_pool,
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPage(1, true);
  };

  return (
    <>
      <Header />
      <main className="properties-page">
        <header className="properties-page__hero">
          <div className="container">
            <h1 className="properties-page__title">Propiedades — LRV Inmobiliaria La Rioja</h1>
            <p className="properties-page__subtitle">
              Buscá por zona, precio, tipo y operación. Todos los inmuebles cuentan con
              documentación.
            </p>
          </div>
        </header>

        <div className="container">
          {/* ── Barra de filtros ──────────────────────────────────── */}
          <form onSubmit={handleSearch} className="pf" aria-label="Filtros de búsqueda">
            {/* Barra principal */}
            <div className="pf__bar">
              <div className="pf__field pf__field--search">
                <svg
                  className="pf__search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por título o ciudad..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="pf__input"
                  aria-label="Buscar propiedades"
                />
              </div>

              <div className="pf__divider" aria-hidden />

              <div className="pf__field">
                <select
                  value={filters.property_type}
                  onChange={(e) => setFilters((f) => ({ ...f, property_type: e.target.value }))}
                  className="pf__select"
                  aria-label="Tipo de inmueble"
                >
                  <option value="">Tipo de inmueble</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pf__divider" aria-hidden />

              <div className="pf__field">
                <select
                  value={filters.operation}
                  onChange={(e) => setFilters((f) => ({ ...f, operation: e.target.value }))}
                  className="pf__select"
                  aria-label="Operación"
                >
                  <option value="">Venta / Alquiler</option>
                  {OPERATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pf__divider" aria-hidden />

              <div className="pf__field">
                <select
                  value={filters.city}
                  onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                  className="pf__select"
                  aria-label="Zona"
                >
                  <option value="">Zona / Localidad</option>
                  {[...new Set(CITIES_LA_RIOJA)].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pf__divider" aria-hidden />

              <button
                type="button"
                className={`pf__adv-btn${advancedOpen ? " pf__adv-btn--open" : ""}`}
                onClick={() => setAdvancedOpen((o) => !o)}
                aria-expanded={advancedOpen}
              >
                Más filtros
                {hasAdvancedActive && <span className="pf__adv-dot" aria-hidden />}
                <svg
                  className={`pf__chevron${advancedOpen ? " pf__chevron--up" : ""}`}
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <button type="submit" className="pf__submit">
                Buscar
              </button>
            </div>

            {/* Panel avanzado */}
            {advancedOpen && (
              <div className="pf__advanced">
                <div className="pf__adv-grid">
                  <label className="pf__adv-field">
                    <span className="pf__adv-label">Precio mínimo</span>
                    <input
                      type="number"
                      placeholder="$ mín"
                      value={filters.min_price}
                      onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))}
                      min={0}
                    />
                  </label>
                  <label className="pf__adv-field">
                    <span className="pf__adv-label">Precio máximo</span>
                    <input
                      type="number"
                      placeholder="$ máx"
                      value={filters.max_price}
                      onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))}
                      min={0}
                    />
                  </label>
                  <label className="pf__adv-field">
                    <span className="pf__adv-label">Ambientes mín.</span>
                    <input
                      type="number"
                      placeholder="Ej: 3"
                      value={filters.min_rooms}
                      onChange={(e) => setFilters((f) => ({ ...f, min_rooms: e.target.value }))}
                      min={0}
                    />
                  </label>
                  <label className="pf__adv-field">
                    <span className="pf__adv-label">Superficie mín. (m²)</span>
                    <input
                      type="number"
                      placeholder="Ej: 80"
                      value={filters.min_area}
                      onChange={(e) => setFilters((f) => ({ ...f, min_area: e.target.value }))}
                      min={0}
                    />
                  </label>
                  <div className="pf__adv-field">
                    <span className="pf__adv-label">Comodidades</span>
                    <div className="pf__checks">
                      <label className="pf__check">
                        <input
                          type="checkbox"
                          checked={filters.has_garage}
                          onChange={(e) =>
                            setFilters((f) => ({ ...f, has_garage: e.target.checked }))
                          }
                        />
                        Garaje
                      </label>
                      <label className="pf__check">
                        <input
                          type="checkbox"
                          checked={filters.has_garden}
                          onChange={(e) =>
                            setFilters((f) => ({ ...f, has_garden: e.target.checked }))
                          }
                        />
                        Jardín
                      </label>
                      <label className="pf__check">
                        <input
                          type="checkbox"
                          checked={filters.has_pool}
                          onChange={(e) =>
                            setFilters((f) => ({ ...f, has_pool: e.target.checked }))
                          }
                        />
                        Pileta
                      </label>
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="pf__adv-footer">
                    <button type="button" className="pf__clear" onClick={clearFilters}>
                      Limpiar todos los filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>

          {loading && listings.length === 0 ? (
            <div className="properties-page__skeleton">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="properties-page__card-skeleton">
                  <div className="properties-page__skeleton-image" />
                  <div className="properties-page__skeleton-content">
                    <span className="properties-page__skeleton-line" style={{ width: "40%" }} />
                    <span className="properties-page__skeleton-line" style={{ width: "90%" }} />
                    <span className="properties-page__skeleton-line" style={{ width: "70%" }} />
                    <span className="properties-page__skeleton-line" style={{ width: "50%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="properties-page__grid">
                {listings.map((p) => (
                  <FeaturedPropertyCard key={p.id} listing={p} onSelect={setSelectedListingId} />
                ))}
              </div>
              {selectedListingId != null && (
                <Suspense fallback={null}>
                  <PropertyDetailModal
                    listingId={selectedListingId}
                    onClose={() => setSelectedListingId(null)}
                  />
                </Suspense>
              )}
              {listings.length === 0 && !loading && (
                <div className="properties-page__empty">
                  <p className="properties-page__empty-title">
                    No hay propiedades con esos filtros
                  </p>
                  <p className="properties-page__empty-text">
                    Probá ampliando la búsqueda o limpiando los filtros.
                  </p>
                  <button type="button" className="btn btn-primary" onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                </div>
              )}
              {hasMore && listings.length > 0 && (
                <div className="properties-page__load">
                  <button
                    type="button"
                    className="btn btn-outline properties-page__load-btn"
                    disabled={loading}
                    onClick={() => fetchPage(page + 1, false)}
                  >
                    {loading ? "Cargando…" : "Ver más propiedades"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
