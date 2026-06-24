import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import { ArrowRight, Building2, Home, Map, Trees } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-fade";
import { SERVICE_SLIDES } from "../data/marketingImages";
import { useInView } from "../hooks/useInView";
import { useReducedMotion } from "../hooks/useReducedMotion";
import "./Services.css";

const services = [
  {
    id: "casas",
    icon: Home,
    title: "Casas",
    description:
      "Venta y alquiler de casas en barrios residenciales, con opciones para familias y profesionales.",
  },
  {
    id: "departamentos",
    icon: Building2,
    title: "Departamentos",
    description:
      "Departamentos en zonas céntricas y residenciales de La Rioja capital y alrededores, para venta y alquiler.",
  },
  {
    id: "terrenos",
    icon: Map,
    title: "Terrenos",
    description:
      "Lotes, terrenos, fincas productivas y campos ganaderos para invertir o habitar, con documentación en regla.",
  },
  {
    id: "fincas-inversiones",
    icon: Trees,
    title: "Fincas e inversiones privadas",
    description:
      "Asesoramiento y operaciones discretas en fincas rurales, campos y oportunidades de inversión para carteras particulares.",
  },
];

const slides = services.map((service, index) => ({
  ...service,
  ...SERVICE_SLIDES[index],
}));

export default function Services() {
  const { ref: headerRef, isInView: headerInView } = useInView({ threshold: 0.35 });
  const { ref: showcaseRef, isInView: showcaseInView } = useInView({ threshold: 0.2 });
  const { reduceMotion } = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);
  const carouselRef = useRef(null);

  const handleCategoryClick = useCallback((index) => {
    setActiveIndex(index);
    swiperRef.current?.slideTo(index);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || reduceMotion) return;

    const ob = new IntersectionObserver(
      ([entry]) => {
        const swiper = swiperRef.current;
        if (!swiper?.autoplay) return;
        if (entry.isIntersecting) swiper.autoplay.start();
        else swiper.autoplay.stop();
      },
      { threshold: 0.25 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [reduceMotion]);

  const active = slides[activeIndex];

  return (
    <section className="section services texture-bone" id="servicios" aria-labelledby="services-title">
      <div className="container">
        <header
          ref={headerRef}
          className={`services__header reveal${headerInView ? " reveal--visible" : ""}`}
        >
          <h2 id="services-title" className="section-title services__title">
            Qué ofrecemos
          </h2>
          <p className="section-subtitle services__subtitle">
            Venta y alquiler en La Rioja: casas, departamentos, terrenos, fincas, campos e inversiones
            privadas.
          </p>
        </header>

        <div
          ref={showcaseRef}
          className={`services__showcase reveal${showcaseInView ? " reveal--visible" : ""}`}
        >
          <div
            ref={carouselRef}
            className="services__carousel-wrap editorial-stage editorial-stage__scrim--right"
          >
            <Swiper
              className="services__swiper"
              modules={[EffectFade, Autoplay]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              speed={600}
              slidesPerView={1}
              loop
              autoplay={
                reduceMotion
                  ? false
                  : {
                      delay: 5000,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }
              }
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            >
              {slides.map((slide) => (
                <SwiperSlide key={slide.id}>
                  <div className="services__slide">
                    <img
                      src={slide.image}
                      alt={slide.imageAlt}
                      className="services__slide-img"
                      width={1920}
                      height={1200}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="services__slide-overlay" aria-hidden="true" />
                    <div className="services__slide-caption">
                      <h3 className="services__slide-title">{slide.title}</h3>
                      <p className="services__slide-desc">{slide.description}</p>
                      <Link to="/propiedades" className="services__slide-cta">
                        Ver propiedades
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <aside
            className="services__panel glass-panel glass-panel--overlay-right glass-panel--on-dark"
            aria-label="Categorías de servicios"
          >
            <p className="services__panel-label">Explorá por categoría</p>
            <ul className="services__categories" role="list">
              {slides.map((slide, index) => {
                const Icon = slide.icon;
                const isActive = index === activeIndex;
                return (
                  <li key={slide.id}>
                    <button
                      type="button"
                      className={`services__category${isActive ? " services__category--active" : ""}`}
                      onClick={() => handleCategoryClick(index)}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span className="services__category-icon" aria-hidden="true">
                        <Icon className="size-5" strokeWidth={1.75} />
                      </span>
                      <span className="services__category-text">
                        <span className="services__category-title">{slide.title}</span>
                        <span className="services__category-desc">{slide.description}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="services__live-caption" aria-live="polite" aria-atomic="true">
              {active.title}: {active.description}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
