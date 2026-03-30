import { useEffect, useId, useRef, useState } from "react";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import { usePointerTilt } from "../hooks/usePointerTilt";
import "./Hero.css";

const FEATURES = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Ubicación premium",
    desc: "Las mejores zonas",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Atención local",
    desc: "Equipo dedicado",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    title: "Financiación flexible",
    desc: "Planes a medida",
  },
];

export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const heroRef = useRef(null);
  const cardWrapRef = useRef(null);
  const titleId = useId();

  usePointerTilt({
    boundsRef: heroRef,
    cardRef: cardWrapRef,
    enabled: !reduceMotion,
    coeffX: 20,
    coeffY: 20,
    rotYMul: -0.5,
    rotXMul: 0.3,
  });

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onMq = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onMq);
    return () => {
      clearTimeout(t);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className={`lrvh-root ${loaded ? "lrvh-root--loaded" : ""} ${reduceMotion ? "lrvh-root--reduced" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="lrvh-bg-base" aria-hidden="true" />
      <div className="lrvh-bg-orb lrvh-bg-orb--1" aria-hidden="true" />
      <div className="lrvh-bg-orb lrvh-bg-orb--2" aria-hidden="true" />
      <div className="lrvh-bg-orb lrvh-bg-orb--3" aria-hidden="true" />
      <div className="lrvh-noise-overlay" aria-hidden="true" />

      <div className="container lrvh-main">
        <div className="lrvh-main-left">
          <div className="lrvh-eyebrow">
            <span className="lrvh-eyebrow-line" />
            <span>La Rioja, Argentina</span>
            <span className="lrvh-eyebrow-dot" aria-hidden="true">
              •
            </span>
            <span>Desde 2015</span>
          </div>

          <h1 id={titleId} className="lrvh-title">
            <span className="lrvh-title-brand">LRV Inmobiliaria</span>
            <span className="lrvh-title-line lrvh-title-line--1">
              Tu nuevo <span className="lrvh-title-accent">hogar</span>
            </span>
            <span className="lrvh-title-line lrvh-title-line--2">te espera</span>
          </h1>

          <p className="lrvh-subtitle">
            Descubrí propiedades en La Rioja con atención personalizada: casas, departamentos,
            terrenos, fincas y campos — venta y alquiler.
          </p>

          <div className="lrvh-features-row">
            {FEATURES.map((f, i) => (
              <div className="lrvh-feature-chip" key={f.title} style={{ "--i": i }}>
                <span className="lrvh-chip-icon">{f.icon}</span>
                <div>
                  <div className="lrvh-chip-title">{f.title}</div>
                  <div className="lrvh-chip-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="lrvh-cta-row">
            <a className="lrvh-btn lrvh-btn--primary" href="#propiedades">
              <span>Explorar propiedades</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a className="lrvh-btn lrvh-btn--secondary" href="#contacto">
              <span className="lrvh-btn-sec-icon" aria-hidden="true">
                <PhoneRoundedIcon sx={{ fontSize: 18 }} />
              </span>
              Contactar
            </a>
          </div>
        </div>

        <div className="lrvh-main-right">
          <div ref={cardWrapRef} className="lrvh-card-wrap">
            <div className="lrvh-main-card">
              <div className="lrvh-card-glow" aria-hidden="true" />
              {!imgError ? (
                <img
                  src="/hero.jpg"
                  alt="Propiedad destacada LRV Inmobiliaria — La Rioja"
                  className="lrvh-property-img"
                  width={800}
                  height={600}
                  fetchPriority="high"
                  decoding="async"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="lrvh-img-placeholder img-placeholder">Agregá public/hero.jpg</div>
              )}
              <div className="lrvh-card-overlay">
                <div className="lrvh-overlay-badge">
                  <span className="lrvh-badge-dot" />
                  Destacado
                </div>
                <div className="lrvh-overlay-info">
                  <div className="lrvh-prop-name">LRV Inmobiliaria</div>
                  <div className="lrvh-prop-price">Consultá disponibilidad</div>
                </div>
              </div>
              <div className="lrvh-card-shine" aria-hidden="true" />
            </div>

            <div className="lrvh-float-card lrvh-float-card--tl">
              <div className="lrvh-fc-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <div className="lrvh-fc-label">Nuevas propiedades</div>
                <div className="lrvh-fc-val">Actualizado semanalmente</div>
              </div>
            </div>

            <div className="lrvh-float-card lrvh-float-card--br">
              <div className="lrvh-fc-stars" aria-hidden="true">
                ★★★★★
              </div>
              <div className="lrvh-fc-label">Valoración clientes</div>
              <div className="lrvh-fc-val">4.9 / 5.0</div>
            </div>

            <div className="lrvh-float-card lrvh-float-card--tr">
              <div className="lrvh-fc-avatar-row" aria-hidden="true">
                <div className="lrvh-fc-avatar lrvh-fc-avatar--1" />
                <div className="lrvh-fc-avatar lrvh-fc-avatar--2" />
                <div className="lrvh-fc-avatar lrvh-fc-avatar--3" />
              </div>
              <div className="lrvh-fc-label">Equipo local</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
