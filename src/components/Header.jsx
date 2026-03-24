import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";

const navLinks = [
  { href: "#inicio", to: "/", label: "Inicio" },
  { href: "#nosotros", to: "/nosotros", label: "Nosotros" },
  { href: "#servicios", to: "/servicios", label: "Servicios" },
  { href: "#propiedades", to: "/propiedades", label: "Propiedades" },
  { href: "#contacto", to: "/contacto", label: "Contacto" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [heroInView, setHeroInView] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isPortal = location.pathname.startsWith("/propiedades");

  /** Rutas donde “Inicio” solo sube el scroll (misma landing / variantes). */
  const scrollOnlyPaths = ["/", "/demo/la-rioja"];

  const goToTopOrHome = (e) => {
    e.preventDefault();
    setMobileOpen(false);
    if (scrollOnlyPaths.includes(location.pathname)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate("/");
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = document.getElementById("hero");
    if (!el) {
      setHeroInView(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { root: null, threshold: 0.15, rootMargin: "-56px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [location.pathname]);

  return (
    <header
      className={`header ${scrolled ? "header--scrolled" : ""} ${heroInView ? "header--hero" : ""}`}
      id="inicio"
    >
      <div className="container header__inner">
        <a href="/" className="header__logo" aria-label="LRV Asociados - Inicio" onClick={goToTopOrHome}>
          <img src="/lrv-asociados.webp" alt="LRV Asociados" className="header__logo-img" />
        </a>

        <nav
          className={`header__nav ${mobileOpen ? "header__nav--open" : ""}`}
          aria-label="Principal"
        >
          {(isPortal ? navLinks : navLinks.slice(0, 5)).map((link) =>
            isPortal ? (
              link.to === "/" ? (
                <Link
                  key={link.to}
                  to="/"
                  className="header__link"
                  onClick={goToTopOrHome}
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.to || link.href}
                  to={link.to}
                  className="header__link"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ) : link.href === "#inicio" ? (
              <a
                key="inicio"
                href="/"
                className="header__link"
                onClick={goToTopOrHome}
              >
                {link.label}
              </a>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="header__link"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <button
          type="button"
          className="header__burger"
          aria-expanded={mobileOpen}
          aria-label="Abrir menú"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
