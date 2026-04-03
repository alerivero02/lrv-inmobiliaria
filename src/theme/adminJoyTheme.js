import { extendTheme } from "@mui/joy/styles";

export const adminJoyTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0f766e",
          700: "#0d5c56",
          solidBg: "#0f766e",
          solidHoverBg: "#0d5c56",
          solidActiveBg: "#0b4743",
        },
        neutral: {
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
      },
    },
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },
  fontFamily: {
    body: '"Outfit", "DM Sans", system-ui, sans-serif',
    display: '"Source Serif 4", "Playfair Display", Georgia, serif',
  },
});
