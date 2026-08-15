import { isValidProvinceCode } from "../constants/provinces.js";
import { filterRowsByPolygon, parsePolygonQuery } from "./geo.js";

export const ORDER_MAP = {
  views: "view_count DESC, updated_at DESC",
  consults: "consult_count DESC, updated_at DESC",
  destacadas: "featured DESC, (view_count + consult_count * 2) DESC, updated_at DESC",
  price_asc: "price ASC NULLS LAST",
  price_desc: "price DESC NULLS LAST",
  updated: "updated_at DESC",
};

export function buildPublicListingWhere(query) {
  const {
    min_price,
    max_price,
    property_type,
    operation,
    city,
    bedrooms,
    province_code,
  } = query;

  const conds = ["status = 'active'"];
  const params = [];
  const polygon = parsePolygonQuery(query.polygon);
  const requireCoords = Boolean(polygon) || query.require_coords === "1";

  if (min_price) {
    conds.push("price >= ?");
    params.push(Number(min_price));
  }
  if (max_price) {
    conds.push("price <= ?");
    params.push(Number(max_price));
  }
  if (property_type) {
    conds.push("property_type = ?");
    params.push(property_type);
  }
  if (query.investment_tag) {
    conds.push("investment_tag = ?");
    params.push(String(query.investment_tag).trim().toLowerCase());
  } else if (query.investment === "1" || query.investment === true || query.investment === 1) {
    conds.push("investment_tag IS NOT NULL AND investment_tag != ''");
  }
  if (operation) {
    conds.push("operation = ?");
    params.push(operation);
  }
  if (province_code) {
    if (!isValidProvinceCode(province_code)) {
      const err = new Error("Código de provincia inválido");
      err.status = 400;
      throw err;
    }
    conds.push("province_code = ?");
    params.push(province_code);
  }
  if (city) {
    conds.push("(LOWER(city) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?))");
    params.push(`%${city}%`, `%${city}%`);
  }
  if (bedrooms) {
    conds.push("rooms >= ?");
    params.push(Number(bedrooms));
  }
  if (query.min_area) {
    conds.push("area_sqm >= ?");
    params.push(Number(query.min_area));
  }
  if (query.has_garage) {
    conds.push("has_garage = 1");
  }
  if (query.has_garden) {
    conds.push("has_garden = 1");
  }
  if (query.has_pool) {
    conds.push("has_pool = 1");
  }
  if (query.search) {
    conds.push(
      "(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?))",
    );
    params.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
  }
  if (query.featured === "1" || query.featured === true || query.featured === 1) {
    conds.push("featured = 1");
  }
  if (requireCoords) {
    conds.push("lat IS NOT NULL AND lng IS NOT NULL");
  }

  return {
    where: `WHERE ${conds.join(" AND ")}`,
    params,
    polygon,
    orderSql: ORDER_MAP[query.order_by] || ORDER_MAP.updated,
  };
}

export function applyPolygonFilter(rows, polygon) {
  return filterRowsByPolygon(rows, polygon);
}

export function paginateArray(items, page, limit) {
  const limitN = Math.min(Number(limit) || 20, 100);
  const pageN = Math.max(Number(page) || 1, 1);
  const offset = (pageN - 1) * limitN;
  const total = items.length;
  return {
    items: items.slice(offset, offset + limitN),
    total,
    page: pageN,
    pages: Math.max(1, Math.ceil(total / limitN)),
  };
}
