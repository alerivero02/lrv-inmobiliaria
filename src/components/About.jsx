import "./About.css";

export default function About() {
  return (
    <section className="section about" id="nosotros" aria-labelledby="about-title">
      <div className="container">
        <div className="about__grid">
          <div className="about__content">
            <h2 id="about-title" className="section-title">
              Nosotros
            </h2>
            <p className="section-subtitle about__subtitle">
              Líderes en el mercado inmobiliario de La Rioja desde 2017.
            </p>
            <p className="about__text">
              En LRV nos especializamos en la venta de casas, departamentos y terrenos en toda la
              provincia. Acompañamos a nuestros clientes con asesoramiento profesional y
              transparencia en cada operación.
            </p>
            <ul className="about__list" role="list">
              <li>+7 años de experiencia en el mercado</li>
              <li>Amplio portfolio de propiedades</li>
              <li>Atención personalizada y seguimiento</li>
              <li>Enfoque en venta (sin alquileres)</li>
            </ul>
          </div>
          <div className="about__visual">
            <figure className="about__photo">
              <img
                src="/Gemini_Generated_Image_521b2h521b2h521b.png"
                alt="Enzo Rivero, agente inmobiliario, dueño y administrador de LRV"
                className="about__photo-img"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
