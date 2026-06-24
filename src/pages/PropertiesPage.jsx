import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { getPublicListings, getPublicListingsMap } from "../api/client";
import FeaturedPropertyCard from "../components/FeaturedPropertyCard";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PropertiesFilterSheet from "../components/PropertiesFilterSheet";
import PropertiesSearchMap from "../components/PropertiesSearchMap";
import {
  ARGENTINA_PROVINCES,
  CITIES_LA_RIOJA,
  DEFAULT_PROVINCE_CODE,
  OPERATION_OPTIONS,
  PROPERTY_TYPE_GROUPS,
} from "../data/cities";
import { getProvinceByCode } from "../data/provinces";
import { useSeo } from "../hooks/useSeo";
import { lazyWithRetry } from "../utils/lazyRetry";
import {
  buildFilterChips,
  countActiveFilters,
  INITIAL_PROPERTY_FILTERS,
} from "../utils/propertyFilters";
import {
  clearSearchPolygon,
  isValidPolygonRing,
  loadSearchPolygon,
  ringEquals,
  saveSearchPolygon,
} from "../utils/polygonSearch";
import "./PropertiesPage.css";

const PropertyDetailModal = lazyWithRetry(() => import("../components/PropertyDetailModal"));

const LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 400;

const ADVANCED_KEYS = [
  "min_price",
  "max_price",
  "min_rooms",
  "min_area",
  "has_garage",
  "has_garden",
  "has_pool",
];

function buildApiParams(filters, polygon) {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.property_type) params.property_type = filters.property_type;
  if (filters.operation) params.operation = filters.operation;
  if (filters.city) params.city = filters.city;
  if (filters.province_code) params.province_code = filters.province_code;
  if (filters.min_price) params.min_price = Number(filters.min_price);
  if (filters.max_price) params.max_price = Number(filters.max_price);
  if (filters.min_rooms) params.bedrooms = Number(filters.min_rooms);
  if (filters.min_area) params.min_area = Number(filters.min_area);
  if (filters.has_garage) params.has_garage = true;
  if (filters.has_garden) params.has_garden = true;
  if (filters.has_pool) params.has_pool = true;
  if (polygon?.length) params.polygon = polygon;
  return params;
}

function LabeledSelect({ label, className = "", children, ...selectProps }) {
  return (
    <label className={`pf__labeled ${className}`.trim()}>
      <span className="pf__labeled-text">{label}</span>
      <select className="pf__select pf__select--labeled" {...selectProps}>
        {children}
      </select>
    </label>
  );
}

export default function PropertiesPage() {
  useSeo({
    title: "Propiedades en venta y alquiler",
    description:
      "Catálogo LRV Inmobiliaria La Rioja: casas, departamentos, terrenos, fincas y campos en venta y alquiler. Buscá LRV o LRV Inmobiliaria.",
    canonicalPath: "/propiedades",
  });

  const [listings, setListings] = useState([]);
  const [mapPins, setMapPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [filters, setFilters] = useState(INITIAL_PROPERTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [polygon, setPolygon] = useState(() => loadSearchPolygon());
  const [mapSectionVisible, setMapSectionVisible] = useState(() => !loadSearchPolygon());
  const [totalCount, setTotalCount] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filters.search]);

  const filtersForApi = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const apiParams = useMemo(
    () => buildApiParams(filtersForApi, polygon),
    [filtersForApi, polygon],
  );

  const hasActiveFilters = Object.keys(INITIAL_PROPERTY_FILTERS).some((k) => {
    const v = filters[k];
    if (k === "province_code") return v !== DEFAULT_PROVINCE_CODE;
    return typeof v === "boolean" ? v : v !== "";
  });
  const hasAdvancedActive = ADVANCED_KEYS.some((k) => {
    const v = filters[k];
    return typeof v === "boolean" ? v : v !== "";
  });
  const hasPolygon = Boolean(polygon?.length);
  const activeFilterCount = countActiveFilters(filters, { hasPolygon });

  const clearPolygon = useCallback(() => {
    clearSearchPolygon();
    setPolygon(null);
    setMapSectionVisible(true);
  }, []);

  const handlePolygonChange = useCallback((ring) => {
    if (!ring || !isValidPolygonRing(ring)) {
      clearSearchPolygon();
      setPolygon(null);
      setMapSectionVisible(true);
      return;
    }
    setPolygon((prev) => {
      if (ringEquals(prev, ring)) return prev;
      saveSearchPolygon(ring);
      return ring;
    });
    setMapSectionVisible(false);
  }, []);

  const clearFilters = () => {
    setFilters(INITIAL_PROPERTY_FILTERS);
    clearPolygon();
  };

  const removeChip = (chip) => {
    if (chip.id === "polygon") {
      clearPolygon();
      return;
    }
    setFilters((f) => ({ ...f, ...chip.clear() }));
  };

  const filterChips = useMemo(
    () =>
      buildFilterChips(filters, {
        hasPolygon,
        onClearPolygon: clearPolygon,
      }),
    [filters, hasPolygon, clearPolygon],
  );

  const fetchPage = useCallback(
    async (pageNum, reset = false) => {
      setLoading(true);
      if (reset) setFetchError("");
      try {
        const data = await getPublicListings({ ...apiParams, limit: LIMIT, page: pageNum });
        const items = Array.isArray(data?.items) ? data.items : [];
        setListings((prev) => (reset ? items : [...prev, ...items]));
        setTotalCount(Number(data?.total ?? items.length));
        setHasMore(pageNum < (data?.pages || 1));
        setPage(pageNum);
      } catch (_) {
        if (reset) {
          setFetchError(
            "No pudimos cargar las propiedades. Verificá tu conexión e intentá de nuevo.",
          );
          setListings([]);
          setTotalCount(0);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [apiParams],
  );

  const fetchMapPins = useCallback(async () => {
    setMapLoading(true);
    try {
      const data = await getPublicListingsMap(apiParams);
      setMapPins(Array.isArray(data?.items) ? data.items : []);
    } catch (_) {
      setMapPins([]);
    } finally {
      setMapLoading(false);
    }
  }, [apiParams]);

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => {
    if (mapSectionVisible || hasPolygon) {
      fetchMapPins();
    }
  }, [fetchMapPins, mapSectionVisible, hasPolygon]);

  const retryFetch = () => {
    fetchPage(1, true);
    if (mapSectionVisible || hasPolygon) fetchMapPins();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setDebouncedSearch(filters.search);
    fetchPage(1, true);
    fetchMapPins();
  };

  const applyFiltersNow = () => {
    setDebouncedSearch(filters.search);
    fetchPage(1, true);
    fetchMapPins();
  };

  const provinceLabel = getProvinceByCode(filters.province_code)?.name ?? "La Rioja";

  return (
    <>
      <Header />
      <main className="properties-page">
        <header className="properties-page__hero">
          <div className="container">
            <h1 className="properties-page__title">Propiedades — LRV Inmobiliaria</h1>
            <p className="properties-page__subtitle">
              Buscá en el mapa, dibujá tu zona ideal y filtrá por provincia, precio y tipo de
              inmueble.
            </p>
          </div>
        </header>

        <div className="container">
          <form onSubmit={handleSearch} className="pf" aria-label="Filtros de búsqueda">
            <div className="pf__row pf__row--primary">
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

              <button
                type="button"
                className="pf__filters-btn"
                aria-expanded={filterSheetOpen}
                onClick={() => setFilterSheetOpen(true)}
              >
                Filtros
                {activeFilterCount > 0 && (
                  <span className="pf__filters-badge">{activeFilterCount}</span>
                )}
              </button>

              <button type="submit" className="pf__submit">
                Buscar
              </button>
            </div>

            <div className="pf__quick pf__quick--desktop">
              <LabeledSelect
                label="Provincia"
                value={filters.province_code}
                onChange={(e) => setFilters((f) => ({ ...f, province_code: e.target.value }))}
              >
                {ARGENTINA_PROVINCES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </LabeledSelect>

              <LabeledSelect
                label="Tipo"
                value={filters.property_type}
                onChange={(e) => setFilters((f) => ({ ...f, property_type: e.target.value }))}
              >
                <option value="">Todos</option>
                {PROPERTY_TYPE_GROUPS.map((group) => (
                  <optgroup key={group.id} label={group.label}>
                    {group.options.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </LabeledSelect>

              <LabeledSelect
                label="Operación"
                value={filters.operation}
                onChange={(e) => setFilters((f) => ({ ...f, operation: e.target.value }))}
              >
                <option value="">Todas</option>
                {OPERATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </LabeledSelect>

              <LabeledSelect
                label="Localidad"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              >
                <option value="">Todas</option>
                {[...new Set(CITIES_LA_RIOJA)].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </LabeledSelect>

              <button
                type="button"
                className={`pf__adv-btn pf__adv-btn--inline${advancedOpen ? " pf__adv-btn--open" : ""}`}
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
            </div>

            {advancedOpen && (
              <div className="pf__advanced pf__advanced--desktop">
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
              </div>
            )}
          </form>

          {filterChips.length > 0 && (
            <div className="pf__chips" aria-label="Filtros activos">
              {filterChips.map((chip) => (
                <span key={chip.id} className="pf__chip">
                  {chip.label}
                  <button
                    type="button"
                    className="pf__chip-remove"
                    aria-label={`Quitar filtro ${chip.label}`}
                    onClick={() => removeChip(chip)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button type="button" className="pf__chips-clear" onClick={clearFilters}>
                Limpiar todo
              </button>
            </div>
          )}

          <PropertiesFilterSheet
            open={filterSheetOpen}
            onOpenChange={setFilterSheetOpen}
            filters={filters}
            onChange={setFilters}
            onApply={applyFiltersNow}
            onClear={clearFilters}
            activeCount={activeFilterCount}
          />

          {hasPolygon && !mapSectionVisible && (
            <div className="properties-page__zone-bar">
              <p className="properties-page__zone-text">
                {loading && listings.length === 0
                  ? "Buscando en tu zona…"
                  : `${totalCount} propiedad${totalCount === 1 ? "" : "es"} dentro de tu zona dibujada`}
              </p>
              <div className="properties-page__zone-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMapSectionVisible(true)}
                >
                  Editar zona en mapa
                </button>
                <button type="button" className="btn btn-outline" onClick={clearPolygon}>
                  Borrar zona
                </button>
              </div>
            </div>
          )}

          <div
            className={`properties-page__map-section${mapSectionVisible ? "" : " properties-page__map-section--hidden"}`}
            aria-hidden={!mapSectionVisible}
          >
            <PropertiesSearchMap
              provinceCode={filters.province_code}
              mapPins={mapPins}
              polygon={polygon}
              onPolygonChange={handlePolygonChange}
              variant="search"
              hoveredId={hoveredListingId}
              onPinHover={setHoveredListingId}
              onPinOpen={setSelectedListingId}
            />
          </div>

          <div className="properties-page__results-bar">
            <p className="properties-page__results-meta">
              {loading && listings.length === 0
                ? "Buscando…"
                : hasPolygon
                  ? mapSectionVisible
                    ? `Dibujá o editá el área en el mapa para filtrar`
                    : `Mostrando ${listings.length} de ${totalCount} en tu zona`
                  : `${totalCount || listings.length} resultado${(totalCount || listings.length) === 1 ? "" : "s"} en ${provinceLabel}`}
              {!hasPolygon && !mapLoading && mapSectionVisible ? ` · ${mapPins.length} en el mapa` : ""}
            </p>
          </div>

          <section className="properties-page__list" aria-label="Listado de propiedades">
              {fetchError && !loading && listings.length === 0 ? (
                <div className="properties-page__empty">
                  <p className="properties-page__empty-title">No pudimos cargar las propiedades</p>
                  <p className="properties-page__empty-text">{fetchError}</p>
                  <button type="button" className="btn btn-primary" onClick={retryFetch}>
                    Reintentar
                  </button>
                </div>
              ) : loading && listings.length === 0 ? (
                <div className="properties-page__skeleton">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="properties-page__card-skeleton">
                      <div className="properties-page__skeleton-image" />
                      <div className="properties-page__skeleton-content">
                        <span className="properties-page__skeleton-line" style={{ width: "40%" }} />
                        <span className="properties-page__skeleton-line" style={{ width: "90%" }} />
                        <span className="properties-page__skeleton-line" style={{ width: "70%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="properties-page__grid grid grid-cols-1 gap-5 sm:grid-cols-2 [&_.property-card]:min-h-[360px]">
                    {listings.map((p) => (
                      <div
                        key={p.id}
                        className={
                          hoveredListingId === p.id ? "properties-page__card--hover" : ""
                        }
                        onMouseEnter={() => setHoveredListingId(p.id)}
                        onMouseLeave={() => setHoveredListingId(null)}
                      >
                        <FeaturedPropertyCard listing={p} onSelect={setSelectedListingId} />
                      </div>
                    ))}
                  </div>
                  {listings.length === 0 && !loading && (
                    <div className="properties-page__empty">
                      <p className="properties-page__empty-title">
                        No hay propiedades con esos filtros en {provinceLabel}
                      </p>
                      <p className="properties-page__empty-text">
                        Probá ampliar la búsqueda, cambiar el tipo de inmueble o borrá el área
                        dibujada en el mapa para ver más opciones en La Rioja.
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
          </section>

          {selectedListingId != null && (
            <Suspense fallback={null}>
              <PropertyDetailModal
                listingId={selectedListingId}
                onClose={() => setSelectedListingId(null)}
              />
            </Suspense>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
