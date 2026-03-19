import { useState } from "react";
import "./Hero.css";

export default function Hero() {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__content">
          <p className="hero__badge">La Rioja, Argentina · Desde 2015</p>
          <h1 id="hero-title" className="hero__title">
            Encontrá tu próximo <span className="hero__title-accent">hogar</span>
          </h1>
          <p className="hero__lead">
            Somos una de las inmobiliarias más reconocidas de La Rioja. Casas, departamentos,
            terrenos, fincas y campos para venta y alquiler.
          </p>
          <div className="hero__actions">
            <a href="#propiedades" className="btn btn-primary">
              Ver propiedades
            </a>
            <a href="#contacto" className="btn btn-outline">
              Contactar
            </a>
          </div>
        </div>
        <div className="hero__visual">
          {!imgError ? (
            <img
              src="/hero.jpg"
              alt="LRV Inmobiliaria - Venta y alquiler de casas, departamentos, terrenos, fincas y campos en La Rioja"
              className="hero__img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="hero__img-placeholder img-placeholder">
              Imagen destacada (agregar public/hero.jpg)
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
