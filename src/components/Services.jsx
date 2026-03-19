import "./Services.css";

const services = [
  {
    id: "casas",
    icon: "🏠",
    title: "Casas",
    description:
      "Venta y alquiler de casas en barrios residenciales, con opciones para familias y profesionales.",
  },
  {
    id: "departamentos",
    icon: "🏢",
    title: "Departamentos",
    description:
      "Departamentos en zonas céntricas y residenciales de La Rioja capital y alrededores, para venta y alquiler.",
  },
  {
    id: "terrenos",
    icon: "📐",
    title: "Terrenos",
    description: "Lotes, terrenos, fincas productivas y campos ganaderos para invertir o habitar, con documentación en regla.",
  },
];

export default function Services() {
  return (
    <section className="section services" id="servicios" aria-labelledby="services-title">
      <div className="container">
        <header className="services__header">
          <h2 id="services-title" className="section-title">
            Qué ofrecemos
          </h2>
          <p className="section-subtitle">
            Venta y alquiler en La Rioja: casas, departamentos, terrenos, fincas y campos.
          </p>
        </header>
        <div className="services__grid" role="list">
          {services.map((service) => (
            <article key={service.id} className="services__card" role="listitem">
              <div className="services__icon" aria-hidden="true">
                {service.icon}
              </div>
              <h3 className="services__card-title">{service.title}</h3>
              <p className="services__card-desc">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
