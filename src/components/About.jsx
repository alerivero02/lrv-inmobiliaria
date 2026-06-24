import { Link } from "react-router-dom";
import { Check, Handshake, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { useInView } from "../hooks/useInView";
import "./About.css";

const HIGHLIGHTS = [
  { icon: Check, text: "+11 años de experiencia en el mercado" },
  { icon: MapPin, text: "Amplio portfolio en La Rioja y alrededores" },
  { icon: Handshake, text: "Atención personalizada y seguimiento" },
  { icon: ShieldCheck, text: "Venta y alquiler con transparencia en cada paso" },
];

const TRUST_CHIPS = [
  { value: "+11", label: "años" },
  { value: "+350", label: "operaciones" },
  { value: "99,9%", label: "satisfacción" },
];

export default function About() {
  const { ref: gridRef, isInView } = useInView({ threshold: 0.2 });

  return (
    <section className="section about texture-bone" id="nosotros" aria-labelledby="about-title">
      <div className="container">
        <div
          ref={gridRef}
          className={`about__grid reveal${isInView ? " reveal--visible" : ""}`}
        >
          <div className="about__visual">
            <figure className="about__figure">
              <img
                src="/EnzoRivero.png"
                alt="Enzo Rivero, agente inmobiliario, dueño y administrador de LRV"
                className="about__photo"
                width={800}
                height={1000}
                loading="lazy"
                decoding="async"
              />
            </figure>
            <p className="about__caption">Enzo Rivero · Fundador</p>
          </div>

          <div className="about__content">
            <p className="about__eyebrow">
              <span className="about__eyebrow-line" aria-hidden="true" />
              LRV Inmobiliaria · La Rioja
              <span className="about__eyebrow-line" aria-hidden="true" />
            </p>
            <h2 id="about-title" className="section-title about__title">
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
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <span className="about__list-icon" aria-hidden="true">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="about__chips" aria-label="Indicadores de confianza">
              {TRUST_CHIPS.map((chip) => (
                <div key={chip.label} className="about__chip">
                  <span className="about__chip-value tabular-nums">{chip.value}</span>
                  <span className="about__chip-label">{chip.label}</span>
                </div>
              ))}
            </div>
            <Link to="/propiedades" className="about__cta">
              Ver propiedades
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
