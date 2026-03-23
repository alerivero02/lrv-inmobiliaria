import { Box, Typography } from "@mui/material";

export function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { sm: "flex-start" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h1" sx={{ mb: subtitle ? 0.75 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.55 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions ? (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}
