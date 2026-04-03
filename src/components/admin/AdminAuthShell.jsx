import { Box, Container, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import { AdminProviders } from "./AdminProviders";

export function AdminAuthShell({ title, subtitle, footer, children }) {
  return (
    <AdminProviders>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
          px: 2,
          background:
            "radial-gradient(ellipse 95% 55% at 0% 0%, rgba(20,184,166,0.2), transparent 45%), radial-gradient(ellipse 80% 45% at 100% 100%, rgba(15,118,110,0.14), transparent 55%), linear-gradient(170deg, #f8faf9 0%, #f2f3f1 45%, #ebece9 100%)",
        }}
      >
        <Container maxWidth="sm">
          <Card
            variant="outlined"
            sx={{
              maxWidth: 460,
              mx: "auto",
              p: { xs: 2.5, sm: 3 },
              borderRadius: "18px",
              boxShadow: "0 18px 40px rgba(28, 25, 23, 0.08)",
            }}
          >
            <Sheet variant="soft" color="primary" sx={{ p: 1.25, borderRadius: "10px", mb: 2 }}>
              <Typography level="title-lg" sx={{ textAlign: "center", fontWeight: 700 }}>
                {title}
              </Typography>
              {subtitle ? (
                <Typography level="body-sm" sx={{ textAlign: "center", mt: 0.5, color: "text.tertiary" }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Sheet>

            {children}

            {footer ? (
              <MuiLink
                component={Link}
                to={footer.to}
                sx={{
                  display: "block",
                  mt: 2.5,
                  textAlign: "center",
                  color: "text.secondary",
                  textDecorationColor: "divider",
                }}
              >
                {footer.label}
              </MuiLink>
            ) : null}
          </Card>
        </Container>
      </Box>
    </AdminProviders>
  );
}
