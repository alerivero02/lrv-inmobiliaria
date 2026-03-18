import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

const navLinks = [
  { href: "#inicio", to: "/", label: "Inicio" },
  { href: "#nosotros", to: "/#nosotros", label: "Nosotros" },
  { href: "#servicios", to: "/#servicios", label: "Servicios" },
  { href: "#propiedades", to: "/propiedades", label: "Propiedades" },
  { href: "#contacto", to: "/#contacto", label: "Contacto" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/propiedades");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? "header--scrolled" : ""}`} id="inicio">
      <div className="container header__inner">
        <Link to="/" className="header__logo" aria-label="LRV Inmobiliaria - Inicio">
          <img src="/logoLRV.webp" alt="LRV Inmobiliaria" className="header__logo-img" />
        </Link>

        <nav
          className={`header__nav ${mobileOpen ? "header__nav--open" : ""}`}
          aria-label="Principal"
        >
          {(isPortal ? navLinks : navLinks.slice(0, 5)).map((link) =>
            isPortal ? (
              <Link
                key={link.to || link.href}
                to={link.to}
                className="header__link"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
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
