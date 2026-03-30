import { useEffect, useRef, useState } from "react";
import { usePointerTilt } from "../hooks/usePointerTilt";
import "./Hero.css";
import "./About.css";

export default function About() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const wrapRef = useRef(null);

  usePointerTilt({
    boundsRef: wrapRef,
    cardRef: wrapRef,
    enabled: !reduceMotion,
    coeffX: 5,
    coeffY: 5,
    rotYMul: -0.5,
    rotXMul: 0.3,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onMq = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onMq);
    return () => {
      mq.removeEventListener("change", onMq);
    };
  }, []);

  return (
    <section
      className={`section about ${reduceMotion ? "about--reduced" : ""}`}
      id="nosotros"
      aria-labelledby="about-title"
    >
      <div className="container">
        <div className="about__grid">
          <div className="about__visual">
            <figure className="about__figure">
              <div ref={wrapRef} className="lrvh-card-wrap about__card-wrap">
                <div className="lrvh-main-card about__hero-card">
                  <div className="lrvh-card-glow" aria-hidden="true" />
                  <img
                    src="/EnzoRivero.png"
                    alt="Enzo Rivero, agente inmobiliario, dueño y administrador de LRV"
                    className="lrvh-property-img"
                    width={800}
                    height={800}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="lrvh-card-shine" aria-hidden="true" />
                </div>
              </div>
            </figure>
          </div>
          <div className="about__content">
            <h2 id="about-title" className="section-title">
              Nosotros
            </h2>
            <p className="section-subtitle about__subtitle">
              Líderes en el mercado inmobiliario de La Rioja desde 2015.
            </p>
            <p className="about__text">
              En LRV nos especializamos en venta y alquiler de casas, departamentos, terrenos,
              fincas y campos en toda la provincia. Acompañamos a nuestros clientes con
              asesoramiento profesional y transparencia en cada operación.
            </p>
            <ul className="about__list" role="list">
              <li>+11 años de experiencia en el mercado</li>
              <li>Amplio portfolio de propiedades</li>
              <li>Atención personalizada y seguimiento</li>
              <li>Venta y alquiler: acompañamos todo el proceso</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
