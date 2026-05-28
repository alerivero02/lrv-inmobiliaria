/**
 * Breakpoints alineados con Tailwind (`theme.screens`).
 * Usar en hooks JS; en JSX/CSS preferir prefijos sm/md/lg/xl.
 */
export const screens = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** Coincide con `md:` — menú móvil del sitio público y Sheet del admin. */
export const MOBILE_MAX_WIDTH = screens.md - 1;
