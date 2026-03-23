import { Box } from "@mui/material";
import { adminContentMaxWidth } from "../../theme/adminTheme";

/** Contenedor principal del panel: ancho máximo y centrado para que las grillas no se estiren sin control. */
export default function AdminMain({ children }) {
  return (
    <Box sx={{ width: "100%", maxWidth: adminContentMaxWidth, mx: "auto", minWidth: 0 }}>{children}</Box>
  );
}
