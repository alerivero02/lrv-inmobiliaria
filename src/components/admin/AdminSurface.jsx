import Sheet from "@mui/joy/Sheet";

export function AdminSurface({ children, sx, variant = "soft" }) {
  return (
    <Sheet
      variant={variant}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: "14px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        ...sx,
      }}
    >
      {children}
    </Sheet>
  );
}
