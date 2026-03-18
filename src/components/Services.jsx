import "./Services.css";

const services = [
  {
    id: "casas",
    icon: "🏠",
    title: "Casas",
    description:
      "Venta de casas en barrios residenciales, con opciones para familias y profesionales.",
  },
  {
    id: "departamentos",
    icon: "🏢",
    title: "Departamentos",
    description:
      "Departamentos en zonas céntricas y residenciales de La Rioja capital y alrededores.",
  },
  {
    id: "terrenos",
    icon: "📐",
    title: "Terrenos",
    description: "Lotes y terrenos para construir o invertir, con documentación en regla.",
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
            Nos dedicamos exclusivamente a la venta. Sin alquileres: compra y venta de inmuebles.
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
