import "./ProfessionalExcellenceSection.css";

export default function ProfessionalExcellenceSection() {
  return (
    <section className="excellence" aria-label="Excelencia profesional">
      <div className="container excellence__inner">
        <div className="excellence__grid">
          <div className="excellence__visual" aria-hidden="true">
            <div className="excellence__visual-card excellence__visual-card--main">
              <img
                src="/hero.jpg"
                alt=""
                loading="lazy"
                decoding="async"
                className="excellence__img"
              />
            </div>
            <div className="excellence__visual-card excellence__visual-card--secondary">
              <img
                src="/Gemini_Generated_Image_521b2h521b2h521b.png"
                alt=""
                loading="lazy"
                decoding="async"
                className="excellence__img excellence__img--secondary"
              />
            </div>
          </div>

          <div className="excellence__content">
            <p className="excellence__eyebrow">Excelencia profesional</p>
            <h2 className="excellence__title">Profesional excellence in real estate.</h2>
            <p className="excellence__text">
              Desde 2015 acompañamos operaciones con transparencia y criterio local: venta y
              alquiler de casas, departamentos, terrenos, fincas y campos en toda La Rioja.
            </p>

            <ul className="excellence__list" role="list">
              <li>
                <strong>Asesoramiento integral</strong>: valuación, documentación y acompañamiento.
              </li>
              <li>
                <strong>Enfoque en resultados</strong>: objetivos claros para cada operación.
              </li>
              <li>
                <strong>Atención humana</strong>: respuesta rápida y seguimiento.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

