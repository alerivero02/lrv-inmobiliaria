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
          <p className="section-subtitle map-search-section__subtitle">
            Usá la herramienta de polígono en el mapa, dibujá el área que te interesa y cerrá el
            contorno en el primer punto. Te llevamos al listado con las publicaciones dentro de tu
            zona — y podés ajustar el área cuando quieras.
          </p>
        </header>

        <Suspense
          fallback={
            <div className="map-search-section__map-fallback">
              <p>Cargando mapa interactivo…</p>
            </div>
          }
        >
          <PropertiesSearchMap
            variant="landing"
            compact
            provinceCode={DEFAULT_PROVINCE_CODE}
            mapPins={[]}
            polygon={null}
            onPolygonChange={() => {}}
            onPolygonComplete={handlePolygonComplete}
          />
        </Suspense>
      </div>
    </section>
  );
}
