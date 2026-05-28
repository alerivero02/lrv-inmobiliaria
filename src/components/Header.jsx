import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#inicio", to: "/", label: "Inicio" },
  { href: "#nosotros", to: "/nosotros", label: "Nosotros" },
  { href: "#servicios", to: "/servicios", label: "Servicios" },
  { href: "#propiedades", to: "/propiedades", label: "Propiedades" },
  { href: "#contacto", to: "/contacto", label: "Contacto" },
];

const linkClass =
  "text-[0.9375rem] font-medium text-lrv-text transition-colors duration-lrv hover:text-lrv-green";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [heroInView, setHeroInView] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isPortal = location.pathname.startsWith("/propiedades");

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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      id="inicio"
      className={cn(
        "fixed inset-x-0 top-0 z-[100] py-4 transition-[background-color,box-shadow] duration-lrv",
        scrolled && "bg-bone/95 shadow-lrv backdrop-blur-xl",
      )}
    >
      <div className="container flex items-center justify-between">
        <a
          href="/"
          className="flex items-center"
          aria-label="LRV Asociados - Inicio"
          onClick={goToTopOrHome}
        >
          <img
            src="/lrv-asociados.webp"
            alt="LRV Asociados"
            className={cn(
              "block h-11 w-auto object-contain transition-[height] duration-300 ease-out",
              heroInView && "h-14",
            )}
          />
        </a>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-[99] bg-black/20 md:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <nav
          className={cn(
            "flex items-center gap-8",
            "max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-[100] max-md:w-[min(280px,85vw)] max-md:flex-col max-md:justify-center max-md:gap-6 max-md:bg-bone max-md:shadow-[-4px_0_24px_rgba(0,0,0,0.08)] max-md:transition-transform max-md:duration-lrv",
            mobileOpen ? "max-md:translate-x-0" : "max-md:translate-x-full",
          )}
          aria-label="Principal"
        >
          {(isPortal ? navLinks : navLinks.slice(0, 5)).map((link) =>
            isPortal ? (
              link.to === "/" ? (
                <Link key={link.to} to="/" className={linkClass} onClick={goToTopOrHome}>
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.to || link.href}
                  to={link.to}
                  className={linkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ) : link.href === "#inicio" ? (
              <a key="inicio" href="/" className={linkClass} onClick={goToTopOrHome}>
                {link.label}
              </a>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className={linkClass}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <button
          type="button"
          className="hidden h-7 w-7 flex-col justify-center gap-[5px] border-0 bg-transparent p-0 max-md:flex"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span
            className={cn(
              "block h-0.5 w-full rounded-sm bg-lrv-text transition-[transform,opacity] duration-lrv",
              mobileOpen && "translate-y-[7px] rotate-45",
            )}
          />
          <span
            className={cn(
              "block h-0.5 w-full rounded-sm bg-lrv-text transition-opacity duration-lrv",
              mobileOpen && "opacity-0",
            )}
          />
          <span
            className={cn(
              "block h-0.5 w-full rounded-sm bg-lrv-text transition-[transform,opacity] duration-lrv",
              mobileOpen && "-translate-y-[7px] -rotate-45",
            )}
          />
        </button>
      </div>
    </header>
  );
}
