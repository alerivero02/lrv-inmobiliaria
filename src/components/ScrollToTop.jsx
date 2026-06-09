import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const scrollToHash = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return true;
        }
        return false;
      };

      if (scrollToHash()) return;

      const delays = [50, 150, 400];
      const timers = delays.map((ms) =>
        setTimeout(() => scrollToHash(), ms),
      );
      return () => timers.forEach(clearTimeout);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
