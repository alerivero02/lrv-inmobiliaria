import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "#inicio", to: "/", label: "Inicio" },
  { href: "#nosotros", to: "/nosotros", label: "Nosotros" },
  { href: "#servicios", to: "/servicios", label: "Servicios" },
  { href: "#propiedades", to: "/propiedades", label: "Propiedades" },
  { href: "#contacto", to: "/contacto", label: "Contacto" },
];

const linkClass =
  "text-[0.9375rem] font-medium text-lrv-text transition-colors duration-lrv hover:text-lrv-green";

const scrollOnlyPaths = ["/", "/demo/la-rioja"];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [heroInView, setHeroInView] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isPortal = location.pathname.startsWith("/propiedades");

  const links = isPortal ? navLinks : navLinks.slice(0, 5);
  const mobileNavLinks = links.filter((link) => link.href !== "#contacto");

  const closeMobile = () => setMobileOpen(false);

  const goToTopOrHome = (e) => {
    e.preventDefault();
    closeMobile();
    if (scrollOnlyPaths.includes(location.pathname)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate("/");
    window.scrollTo(0, 0);
  };

  const goToSection = (e, href) => {
    e.preventDefault();
    closeMobile();
    if (scrollOnlyPaths.includes(location.pathname)) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate({ pathname: "/", hash: href.replace("#", "") });
  };

  const isLinkActive = (link) => {
    if (link.to === "/propiedades" || link.href === "#propiedades") {
      return location.pathname.startsWith("/propiedades");
    }
    if (link.href === "#inicio" || link.to === "/") {
      if (scrollOnlyPaths.includes(location.pathname)) {
        return !location.hash || location.hash === "#inicio";
      }
      return location.pathname === "/" && !location.hash;
    }
    if (scrollOnlyPaths.includes(location.pathname)) {
      return location.hash === link.href;
    }
    return false;
  };

  const mobileLinkClass = (link) =>
    cn(
      "block w-full border-b border-bone-border/60 px-5 py-3.5 text-left text-base font-medium text-lrv-text transition-colors duration-lrv last:border-b-0",
      "hover:bg-lrv-green-light hover:text-lrv-green",
      isLinkActive(link) &&
        "border-l-[3px] border-lrv-green bg-lrv-green-light pl-[calc(1.25rem-3px)] text-lrv-green",
    );

  const renderNavLink = (link) => {
    if (isPortal) {
      if (link.to === "/") {
        return (
          <button key={link.to} type="button" className={linkClass} onClick={goToTopOrHome}>
            {link.label}
          </button>
        );
      }
      if (link.to === "/propiedades") {
        return (
          <Link key={link.to} to="/propiedades" className={linkClass} onClick={closeMobile}>
            {link.label}
          </Link>
        );
      }
      return (
        <button
          key={link.href}
          type="button"
          className={linkClass}
          onClick={(e) => goToSection(e, link.href)}
        >
          {link.label}
        </button>
      );
    }

    if (link.href === "#inicio") {
      return (
        <a key="inicio" href="/" className={linkClass} onClick={goToTopOrHome}>
          {link.label}
        </a>
      );
    }

    return (
      <a key={link.href} href={link.href} className={linkClass} onClick={closeMobile}>
        {link.label}
      </a>
    );
  };

  const renderMobileNavLink = (link) => {
    if (isPortal) {
      if (link.to === "/") {
        return (
          <button
            key={link.to}
            type="button"
            className={mobileLinkClass(link)}
            onClick={goToTopOrHome}
          >
            {link.label}
          </button>
        );
      }
      if (link.to === "/propiedades") {
        return (
          <Link
            key={link.to}
            to="/propiedades"
            className={mobileLinkClass(link)}
            onClick={closeMobile}
          >
            {link.label}
          </Link>
        );
      }
      return (
        <button
          key={link.href}
          type="button"
          className={mobileLinkClass(link)}
          onClick={(e) => goToSection(e, link.href)}
        >
          {link.label}
        </button>
      );
    }

    if (link.href === "#inicio") {
      return (
        <a key="inicio" href="/" className={mobileLinkClass(link)} onClick={goToTopOrHome}>
          {link.label}
        </a>
      );
    }

    return (
      <a
        key={link.href}
        href={link.href}
        className={mobileLinkClass(link)}
        onClick={closeMobile}
      >
        {link.label}
      </a>
    );
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
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

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

        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {links.map(renderNavLink)}
        </nav>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 flex-col justify-center gap-[5px] border-0 bg-transparent p-0 md:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
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
          </SheetTrigger>
          <SheetContent
            side="right"
            showCloseButton
            overlayClassName="bg-black/45"
            className="flex w-[min(300px,88vw)] flex-col gap-0 border-none bg-white p-0 shadow-[-8px_0_32px_rgba(0,0,0,0.12)] sm:max-w-none"
          >
            <SheetHeader className="border-b border-bone-border px-5 py-4">
              <SheetTitle className="font-display text-lg font-semibold text-lrv-text">
                Menú
              </SheetTitle>
              <SheetDescription className="sr-only">
                Navegación principal del sitio
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-1 flex-col overflow-y-auto" aria-label="Principal">
              {mobileNavLinks.map(renderMobileNavLink)}
            </nav>
            <SheetFooter className="border-t border-bone-border px-5 py-4">
              {isPortal ? (
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={(e) => goToSection(e, "#contacto")}
                >
                  Contacto
                </button>
              ) : (
                <a
                  href="#contacto"
                  className="btn btn-primary w-full"
                  onClick={closeMobile}
                >
                  Contacto
                </a>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
