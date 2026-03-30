import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ThemeProvider } from "@mui/material/styles";
import { login, isAuthenticated } from "../../api/client";
import { adminTheme } from "../../theme/adminTheme";
import { useSeo } from "../../hooks/useSeo";

export default function LoginPage() {
  useSeo({
    title: "Iniciar sesión",
    description: "Acceso al panel LRV Inmobiliaria.",
    canonicalPath: "/admin/login",
    noIndex: true,
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={adminTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
          px: 2,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#dfe0d8",
          backgroundImage: `
            radial-gradient(ellipse 100% 60% at 15% 10%, rgba(15, 118, 110, 0.18), transparent 55%),
            radial-gradient(ellipse 80% 50% at 90% 85%, rgba(13, 92, 86, 0.12), transparent 50%),
            linear-gradient(168deg, #eceae6 0%, #e0ded8 40%, #d8d6d0 100%)
          `,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(-12deg, transparent, transparent 100px, rgba(255,255,255,0.03) 100px, rgba(255,255,255,0.03) 101px)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 420,
              mx: "auto",
              p: 0,
              borderRadius: "18px",
              border: "1px solid rgba(28, 25, 23, 0.08)",
              boxShadow: "0 4px 6px rgba(28,25,23,0.04), 0 24px 48px rgba(28,25,23,0.1), 0 0 0 1px rgba(255,255,255,0.6) inset",
              overflow: "hidden",
            }}
          >
            <Box sx={{ height: 5, background: "linear-gradient(90deg, #0f766e, #14b8a6, #0d9488)" }} />
            <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" component="h1" color="primary" textAlign="center" sx={{ mb: 0.5 }}>
              LRV Admin
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3, lineHeight: 1.5 }}>
              Inmobiliaria · Acceso al panel de gestión
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
              {error && (
                <Alert severity="error" onClose={() => setError("")} sx={{ py: 0 }}>
                  {error}
                </Alert>
              )}
              <TextField
                label="Usuario"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                autoComplete="username"
                disabled={loading}
              />
              <TextField
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete="current-password"
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 0.5, py: 1.4 }}>
                {loading ? "Entrando…" : "Entrar al panel"}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              <Link to="/admin/olvide-contrasena" style={{ color: "inherit", fontWeight: 600, fontSize: "0.875rem" }}>
                Olvidé mi contraseña
              </Link>
            </Typography>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Link to="/" style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}>
                ← Volver al sitio público
              </Link>
            </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
