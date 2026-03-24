import { createTheme } from "@mui/material/styles";
import "./admin-fonts.css";

const serif = '"Source Serif 4", "Playfair Display", Georgia, serif';
const sans = '"Outfit", "DM Sans", system-ui, sans-serif';

export const adminContentMaxWidth = 1440;

export const adminTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f766e", light: "#14b8a6", dark: "#0d5c56", contrastText: "#fff" },
    secondary: { main: "#44403c", light: "#57534e", dark: "#292524" },
    success: { main: "#15803d", light: "#22c55e" },
    error: { main: "#b91c1c", light: "#ef4444" },
    warning: { main: "#c2410c", light: "#ea580c" },
    info: { main: "#0369a1", light: "#0ea5e9" },
    text: {
      primary: "#1c1917",
      secondary: "#78716c",
    },
    divider: "#e7e5e4",
    background: {
      default: "#e8e6e1",
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
    h1: { fontFamily: serif, fontWeight: 600, fontSize: "2rem", letterSpacing: "-0.02em", lineHeight: 1.2 },
    h2: { fontFamily: serif, fontWeight: 600, fontSize: "1.65rem", letterSpacing: "-0.02em", lineHeight: 1.25 },
    h3: { fontFamily: serif, fontWeight: 600, fontSize: "1.35rem", letterSpacing: "-0.015em", lineHeight: 1.3 },
    h4: { fontFamily: serif, fontWeight: 600, fontSize: "1.6rem", letterSpacing: "-0.02em", lineHeight: 1.25 },
    h5: { fontFamily: serif, fontWeight: 600, fontSize: "1.28rem", letterSpacing: "-0.015em", lineHeight: 1.3 },
    h6: { fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600, fontSize: "0.9375rem" },
    subtitle2: { fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "0.02em" },
    body1: { fontSize: "0.9375rem", lineHeight: 1.55 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    button: { fontWeight: 600, letterSpacing: "0.02em" },
    caption: { fontSize: "0.75rem", color: "#78716c" },
    overline: {
      fontFamily: sans,
      fontWeight: 600,
      fontSize: "0.6875rem",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#78716c",
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
        root: { textTransform: "none", fontWeight: 600, borderRadius: 10, paddingInline: 18 },
        containedPrimary: {
          background: "linear-gradient(180deg, #0f766e 0%, #0d5c56 100%)",
          "&:hover": { background: "linear-gradient(180deg, #115e59 0%, #0b4743 100%)" },
        },
        outlined: { borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } },
        sizeLarge: { paddingTop: 12, paddingBottom: 12, fontSize: "0.9375rem" },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 14,
          border: "1px solid",
          borderColor: "#e7e5e4",
          boxShadow: "0 1px 3px rgba(28,25,23,0.04)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid #e7e5e4",
          boxShadow: "0 2px 12px rgba(28,25,23,0.05)",
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, border: "1px solid #e7e5e4" },
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
          borderRadius: 14,
          fontSize: "0.875rem",
          "--DataGrid-rowBorderColor": theme.palette.grey[200],
        }),
        columnHeaders: ({ theme }) => ({
          backgroundColor: theme.palette.grey[100],
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
        cell: { borderColor: "#f5f5f4" },
        footerContainer: ({ theme }) => ({
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.grey[50],
          minHeight: 48,
        }),
      },
    },
  },
});
