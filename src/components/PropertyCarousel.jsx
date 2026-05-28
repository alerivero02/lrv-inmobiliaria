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

const FEATURED_LIMIT = 6;

export default function PropertyCarousel({ onSelectListing }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicListings({ featured: true, limit: FEATURED_LIMIT, order_by: "updated" })
      .then((data) => setListings(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const enableLoop = listings.length >= 6;

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

        {loading ? (
          <p className="properties__carousel-status" aria-live="polite">
            Cargando destacadas…
          </p>
        ) : listings.length === 0 ? (
          <div className="properties__carousel-empty">
            <p>Próximamente más propiedades destacadas.</p>
            <Link to="/propiedades" className="btn btn-primary properties__all-link">
              Ver todas las publicaciones
            </Link>
          </div>
        ) : (
          <div className="properties__carousel max-md:px-2">
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
              {listings.map((listing) => (
                <SwiperSlide key={listing.id}>
                  <FeaturedPropertyCard
                    listing={listing}
                    onSelect={onSelectListing}
                    isPlaceholder={false}
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="properties__nav max-md:hidden">
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
        )}

        {listings.length > 0 && (
          <div className="properties__footer">
            <Link to="/propiedades" className="btn btn-primary properties__all-link">
              Ver todas las publicaciones
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
