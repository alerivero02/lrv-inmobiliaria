import * as React from "react";
import { MOBILE_MAX_WIDTH } from "@/lib/breakpoints";

function getIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= MOBILE_MAX_WIDTH;
}

/**
 * Debe coincidir con el breakpoint `md:` de Tailwind (768px).
 * Estado inicial desde `window` para que el primer paint en móvil use Sheet y no el layout de escritorio.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobile);

  React.useLayoutEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return isMobile;
}
