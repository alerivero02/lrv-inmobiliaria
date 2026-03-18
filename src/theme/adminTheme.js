import { createTheme } from "@mui/material/styles";

export const adminTheme = createTheme({
  palette: {
    primary: { main: "#00a86b" },
    secondary: { main: "#008f5a" },
    success: { main: "#059669" },
    error: { main: "#dc2626" },
    warning: { main: "#d97706" },
    background: {
      default: "#faf8f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
      },
    },
  },
});
