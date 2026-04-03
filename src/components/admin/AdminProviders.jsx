import { CssBaseline } from "@mui/material";
import { ThemeProvider, THEME_ID as MATERIAL_THEME_ID } from "@mui/material/styles";
import { adminTheme } from "../../theme/adminTheme";

export function AdminProviders({ children }) {
  return (
    <ThemeProvider theme={{ [MATERIAL_THEME_ID]: adminTheme }}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
