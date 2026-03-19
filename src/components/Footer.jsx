import "./Footer.css";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="#inicio" className="footer__logo">
            <span className="footer__logo-icon">LRV</span>
            <span className="footer__logo-text">Inmobiliaria</span>
          </a>
          <p className="footer__tagline">
            Venta y alquiler de casas, departamentos, terrenos, fincas y campos en La Rioja,
            Argentina.
          </p>
        </div>
        <div className="footer__links">
          <a href="#nosotros">Nosotros</a>
          <a href="#servicios">Servicios</a>
          <a href="#propiedades">Propiedades</a>
          <a href="#contacto">Contacto</a>
        </div>
        <div className="footer__copy">
          <p>© {currentYear} LRV Inmobiliaria. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
