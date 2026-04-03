import * as React from "react"

const MOBILE_BREAKPOINT = 768

function getIsMobile() {
  if (typeof window === "undefined") return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

/**
 * Debe coincidir con el breakpoint `md:` del Sidebar (Tailwind).
 * Estado inicial desde `window` para que el primer paint en móvil use Sheet y no el layout de escritorio.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobile)

  React.useLayoutEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const sync = () => setIsMobile(mql.matches)
    sync()
    mql.addEventListener("change", sync)
    return () => mql.removeEventListener("change", sync)
  }, [])

  return isMobile
}
