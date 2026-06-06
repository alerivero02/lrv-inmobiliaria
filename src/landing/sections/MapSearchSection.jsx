import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_PROVINCE_CODE } from "../../data/cities";
import { lazyWithRetry } from "../../utils/lazyRetry";
import { saveSearchPolygon } from "../../utils/polygonSearch";
import "./MapSearchSection.css";

const PropertiesSearchMap = lazyWithRetry(() => import("../../components/PropertiesSearchMap"));

export default function MapSearchSection() {
  const navigate = useNavigate();

  const handlePolygonComplete = (ring) => {
    if (saveSearchPolygon(ring)) {
      navigate("/propiedades");
    }
  };

  return (
    <section className="map-search-section section" id="buscar-mapa" aria-labelledby="map-search-title">
      <div className="container">
        <header className="map-search-section__header">
          <h2 id="map-search-title" className="section-title">
            Encontrá tu próxima propiedad es más fácil con nosotros
          </h2>
        </header>

        <div className="map-search-section__grid">
          <div className="map-search-section__map">
            <Suspense
              fallback={
                <div className="map-search-section__map-fallback">
                  <p>Cargando mapa interactivo…</p>
                </div>
              }
            >
              <PropertiesSearchMap
                variant="landing"
                provinceCode={DEFAULT_PROVINCE_CODE}
                mapPins={[]}
                polygon={null}
                onPolygonChange={() => {}}
                onPolygonComplete={handlePolygonComplete}
              />
            </Suspense>
          </div>

          <ol className="map-search-section__steps">
            <li className="map-search-section__step">
              <span className="map-search-section__step-num">01</span>
              <div>
                <h3 className="map-search-section__step-title">Seleccioná</h3>
                <p className="map-search-section__step-desc">
                  Tocá «Dibujar área» en la barra superior del mapa.
                </p>
              </div>
            </li>
            <li className="map-search-section__step">
              <span className="map-search-section__step-num">02</span>
              <div>
                <h3 className="map-search-section__step-title">Dibujá tu zona</h3>
                <p className="map-search-section__step-desc">
                  Marcá los puntos del área que te interesa y cerrá el contorno haciendo clic en el
                  primer punto.
                </p>
              </div>
            </li>
            <li className="map-search-section__step">
              <span className="map-search-section__step-num">03</span>
              <div>
                <h3 className="map-search-section__step-title">¡Listo!</h3>
                <p className="map-search-section__step-desc">
                  Te mostraremos automáticamente las publicaciones dentro de tu zona. Podés ajustarla
                  cuando quieras.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
