import { DEFAULT_PROVINCE_CODE, OPERATION_OPTIONS } from "../data/cities";
import { TYPE_LABELS } from "../data/propertyTypes";
import { getProvinceByCode } from "../data/provinces";

export { INITIAL_PROPERTY_FILTERS } from "./propertyFiltersInitial.js";

const OPERATION_LABELS = Object.fromEntries(OPERATION_OPTIONS.map((o) => [o.value, o.label]));

/**
 * Chips removibles para la barra de filtros activos.
 * @returns {{ id: string, label: string, clear: () => object }[]}
 */
export function buildFilterChips(filters, { hasPolygon, onClearPolygon }) {
  const chips = [];

  if (filters.search?.trim()) {
    chips.push({
      id: "search",
      label: `“${filters.search.trim()}”`,
      clear: () => ({ search: "" }),
    });
  }

  if (filters.province_code && filters.province_code !== DEFAULT_PROVINCE_CODE) {
    const name = getProvinceByCode(filters.province_code)?.name ?? filters.province_code;
    chips.push({
      id: "province",
      label: name,
      clear: () => ({ province_code: DEFAULT_PROVINCE_CODE }),
    });
  }

  if (filters.property_type) {
    chips.push({
      id: "property_type",
      label: TYPE_LABELS[filters.property_type] ?? filters.property_type,
      clear: () => ({ property_type: "" }),
    });
  }

  if (filters.operation) {
    chips.push({
      id: "operation",
      label: OPERATION_LABELS[filters.operation] ?? filters.operation,
      clear: () => ({ operation: "" }),
    });
  }

  if (filters.city) {
    chips.push({
      id: "city",
      label: filters.city,
      clear: () => ({ city: "" }),
    });
  }

  if (filters.min_price) {
    chips.push({
      id: "min_price",
      label: `Desde $${filters.min_price}`,
      clear: () => ({ min_price: "" }),
    });
  }

  if (filters.max_price) {
    chips.push({
      id: "max_price",
      label: `Hasta $${filters.max_price}`,
      clear: () => ({ max_price: "" }),
    });
  }

  if (filters.min_rooms) {
    chips.push({
      id: "min_rooms",
      label: `${filters.min_rooms}+ amb.`,
      clear: () => ({ min_rooms: "" }),
    });
  }

  if (filters.min_area) {
    chips.push({
      id: "min_area",
      label: `${filters.min_area} m²+`,
      clear: () => ({ min_area: "" }),
    });
  }

  if (filters.has_garage) {
    chips.push({ id: "garage", label: "Garaje", clear: () => ({ has_garage: false }) });
  }
  if (filters.has_garden) {
    chips.push({ id: "garden", label: "Jardín", clear: () => ({ has_garden: false }) });
  }
  if (filters.has_pool) {
    chips.push({ id: "pool", label: "Pileta", clear: () => ({ has_pool: false }) });
  }

  if (hasPolygon) {
    chips.push({
      id: "polygon",
      label: "Zona en mapa",
      clear: () => {
        onClearPolygon?.();
        return {};
      },
    });
  }

  return chips;
}

export function countActiveFilters(filters, { hasPolygon } = {}) {
  let n = 0;
  if (filters.search?.trim()) n += 1;
  if (filters.province_code && filters.province_code !== DEFAULT_PROVINCE_CODE) n += 1;
  if (filters.property_type) n += 1;
  if (filters.operation) n += 1;
  if (filters.city) n += 1;
  if (filters.min_price) n += 1;
  if (filters.max_price) n += 1;
  if (filters.min_rooms) n += 1;
  if (filters.min_area) n += 1;
  if (filters.has_garage) n += 1;
  if (filters.has_garden) n += 1;
  if (filters.has_pool) n += 1;
  if (hasPolygon) n += 1;
  return n;
}
