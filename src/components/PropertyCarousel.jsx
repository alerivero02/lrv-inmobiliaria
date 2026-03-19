import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { getPublicListings } from "../api/client";
import FeaturedPropertyCard from "./FeaturedPropertyCard";
import "./PropertyCarousel.css";

/** Espacios listos para usarse: placeholders con la misma forma que una publicación para el componente reutilizable */
const PLACEHOLDER_LISTINGS = [
  {
    id: -1,
    property_type: "casa",
    operation: "venta",
    title: "Casa amplia en zona residencial",
    city: "La Rioja Capital",
    address: null,
    rooms: 3,
    area_sqm: 120,
    price: null,
    images: [],
  },
  {
    id: -2,
    property_type: "departamento",
    operation: "venta",
    title: "Depto 2 ambientes céntrico",
    city: "Centro",
    address: null,
    rooms: 2,
    area_sqm: 55,
    price: null,
    images: [],
  },
  {
    id: -3,
    property_type: "terreno",
    operation: "venta",
    title: "Lote en barrio cerrado",
    city: "La Rioja",
    address: null,
    rooms: null,
    area_sqm: 300,
    price: null,
    images: [],
  },
];

export default function PropertyCarousel({ onSelectListing }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicListings({ limit: 20, order_by: "destacadas" })
      .then((data) => setListings(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const itemsToShow = loading || listings.length === 0 ? PLACEHOLDER_LISTINGS : listings;
  // Loop requiere al menos el doble del max slidesPerView (3) para no generar warnings
  const enableLoop = itemsToShow.length >= 6;

  return (
    <section className="section properties" id="propiedades" aria-labelledby="properties-title">
      <div className="container">
        <header className="properties__header">
          <h2 id="properties-title" className="section-title">
            Propiedades destacadas
          </h2>
          <p className="section-subtitle">
            Una selección de propiedades en venta y alquiler. Contactanos para ver el listado completo.
          </p>
        </header>

        <div className="properties__carousel">
          <Swiper
            className="properties__swiper"
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            navigation={{
              prevEl: ".properties__arrow--prev",
              nextEl: ".properties__arrow--next",
            }}
            pagination={{ clickable: true }}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
            }}
            loop={enableLoop}
          >
            {itemsToShow.map((listing) => (
              <SwiperSlide key={listing.id}>
                <FeaturedPropertyCard
                  listing={listing}
                  onSelect={onSelectListing}
                  isPlaceholder={listing.id < 0}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="properties__nav">
            <button
              type="button"
              className="properties__arrow properties__arrow--prev"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="properties__arrow properties__arrow--next"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        </div>

        <div className="properties__footer">
          <Link to="/propiedades" className="btn btn-primary properties__all-link">
            Ver todas las publicaciones
          </Link>
        </div>
      </div>
    </section>
  );
}
