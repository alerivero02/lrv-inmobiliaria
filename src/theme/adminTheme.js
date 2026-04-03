import { createTheme } from "@mui/material/styles";
import "./admin-fonts.css";
import "./admin-shadcn-bridge.css";

/* Misma familia que el shell shadcn (Geist en index.css + tokens). */
const sans =
  '"Geist Variable", "DM Sans", "Outfit", system-ui, -apple-system, sans-serif';

export const adminContentMaxWidth = 1440;

export const adminTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f766e", light: "#14b8a6", dark: "#0d5c56", contrastText: "#fff" },
    secondary: { main: "#3f3f46", light: "#52525b", dark: "#27272a" },
    success: { main: "#15803d", light: "#22c55e" },
    error: { main: "#b91c1c", light: "#ef4444" },
    warning: { main: "#c2410c", light: "#ea580c" },
    info: { main: "#0369a1", light: "#0ea5e9" },
    text: {
      primary: "#18181b",
      secondary: "#71717a",
    },
    divider: "#e4e4e7",
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
    action: {
      hover: "rgba(15, 118, 110, 0.06)",
      selected: "rgba(15, 118, 110, 0.1)",
    },
    grey: {
      50: "#fafaf9",
      100: "#f5f5f4",
      200: "#e7e5e4",
      300: "#d6d3d1",
      400: "#a8a29e",
      500: "#78716c",
      600: "#57534e",
      700: "#44403c",
      800: "#292524",
      900: "#1c1917",
    },
    admin: {
      sidebar: "#0c0f12",
      sidebarElevated: "#12171c",
      sidebarBorder: "rgba(255,255,255,0.06)",
      sidebarText: "rgba(255,255,255,0.72)",
      sidebarTextMuted: "rgba(255,255,255,0.45)",
      sidebarHover: "rgba(255,255,255,0.06)",
      sidebarActive: "rgba(20, 184, 166, 0.14)",
      accent: "#2dd4bf",
    },
  },
  typography: {
    fontFamily: sans,
    h1: { fontWeight: 600, fontSize: "2rem", letterSpacing: "-0.025em", lineHeight: 1.2 },
    h2: { fontWeight: 600, fontSize: "1.65rem", letterSpacing: "-0.02em", lineHeight: 1.25 },
    h3: { fontWeight: 600, fontSize: "1.35rem", letterSpacing: "-0.02em", lineHeight: 1.3 },
    h4: { fontWeight: 600, fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.25 },
    h5: { fontWeight: 600, fontSize: "1.2rem", letterSpacing: "-0.015em", lineHeight: 1.3 },
    h6: { fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600, fontSize: "0.9375rem" },
    subtitle2: { fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.02em" },
    body1: { fontSize: "0.9375rem", lineHeight: 1.55 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    button: { fontWeight: 600, letterSpacing: "0.01em" },
    caption: { fontSize: "0.75rem", color: "#71717a" },
    overline: {
      fontFamily: sans,
      fontWeight: 600,
      fontSize: "0.6875rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#71717a",
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontFamily: sans },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: "var(--radius)", paddingInline: 16 },
        containedPrimary: {
          backgroundColor: "#0f766e",
          "&:hover": { backgroundColor: "#0d5c56" },
        },
        outlined: { borderWidth: 1, borderColor: "#e4e4e7", "&:hover": { borderWidth: 1, borderColor: "#d4d4d8" } },
        sizeLarge: { paddingTop: 12, paddingBottom: 12, fontSize: "0.9375rem" },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: "var(--radius)",
          border: "1px solid #e4e4e7",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "var(--radius)",
          border: "1px solid #e4e4e7",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: "var(--radius)" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: "var(--radius)", border: "1px solid #e4e4e7" },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          "&.Mui-selected": { backgroundColor: "rgba(15, 118, 110, 0.12)" },
        },
      },
    },
    MuiDataGrid: {
      defaultProps: {
        rowHeight: 52,
        columnHeaderHeight: 44,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          border: "none",
          borderRadius: "var(--radius)",
          fontSize: "0.875rem",
          "--DataGrid-rowBorderColor": theme.palette.grey[200],
        }),
        columnHeaders: ({ theme }) => ({
          backgroundColor: "#f4f4f5",
          borderBottom: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
        }),
        columnHeaderTitle: {
          fontWeight: 700,
          fontSize: "0.6875rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        },
        row: ({ theme }) => ({
          "&:hover": { backgroundColor: "rgba(15, 118, 110, 0.04)" },
          "&.Mui-selected": { backgroundColor: "rgba(15, 118, 110, 0.08)" },
        }),
        cell: { borderColor: "#f4f4f5" },
        footerContainer: ({ theme }) => ({
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: "#fafafa",
          minHeight: 48,
        }),
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 500,
        },
      },
    },
  },
});
