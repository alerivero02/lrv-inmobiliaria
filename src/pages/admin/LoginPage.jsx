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

export default function LoginPage() {
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
          bgcolor: "background.default",
          py: 3,
        }}
      >
        <Container maxWidth="xs">
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
            <Typography
              variant="h5"
              component="h1"
              color="primary"
              fontWeight={700}
              textAlign="center"
              gutterBottom
            >
              LRV Admin
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              Inmobiliaria · Panel de gestión
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
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
                size="medium"
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
                size="medium"
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
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? "Entrando…" : "Entrar"}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1.5 }}>
              <Link to="/admin/olvide-contrasena" style={{ color: "inherit", fontSize: "0.875rem" }}>
                Olvidé mi contraseña
              </Link>
            </Typography>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
                ← Volver al sitio
              </Link>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
