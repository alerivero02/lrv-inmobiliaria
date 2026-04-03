import { CssBaseline } from "@mui/material";
import { ThemeProvider, THEME_ID as MATERIAL_THEME_ID } from "@mui/material/styles";
import { CssVarsProvider } from "@mui/joy/styles";
import { adminTheme } from "../../theme/adminTheme";
import { adminJoyTheme } from "../../theme/adminJoyTheme";

export function AdminProviders({ children }) {
  return (
    <CssVarsProvider theme={adminJoyTheme}>
      <ThemeProvider theme={{ [MATERIAL_THEME_ID]: adminTheme }}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CssVarsProvider>
  );
}
