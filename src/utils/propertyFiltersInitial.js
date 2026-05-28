import { DEFAULT_PROVINCE_CODE } from "../data/cities";

export const INITIAL_PROPERTY_FILTERS = {
  search: "",
  property_type: "",
  operation: "",
  city: "",
  province_code: DEFAULT_PROVINCE_CODE,
  min_price: "",
  max_price: "",
  min_rooms: "",
  min_area: "",
  has_garage: false,
  has_garden: false,
  has_pool: false,
};
