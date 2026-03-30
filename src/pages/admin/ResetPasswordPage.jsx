import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
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
import { resetPasswordWithToken, isAuthenticated } from "../../api/client";
import { adminTheme } from "../../theme/adminTheme";
import { useSeo } from "../../hooks/useSeo";

export default function ResetPasswordPage() {
  useSeo({
    title: "Restablecer contraseña",
    description: "Nueva contraseña — panel LRV Inmobiliaria.",
    canonicalPath: "/admin/restablecer-contrasena",
    noIndex: true,
  });

  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) {
      setError("Enlace incompleto. Usá el link del correo que recibiste.");
      return;
    }
    setLoading(true);
    try {
      const r = await resetPasswordWithToken(token, password);
      setSuccess(r.detail || "Listo");
      setTimeout(() => navigate("/admin/login", { replace: true }), 2000);
    } catch (err) {
      setError(err.message || "Error");
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
            <Typography variant="h5" component="h1" color="primary" fontWeight={700} textAlign="center">
              Nueva contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
              Elegí una contraseña segura para tu cuenta.
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
              Mínimo 12 caracteres, mayúsculas, minúsculas, número y símbolo.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {error && (
                <Alert severity="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
              {success && <Alert severity="success">{success}</Alert>}
              <TextField
                label="Nueva contraseña"
                type={show1 ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                disabled={loading}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={show1 ? "Ocultar" : "Mostrar"}
                        onClick={() => setShow1((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {show1 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Repetir contraseña"
                type={show2 ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                fullWidth
                disabled={loading}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={show2 ? "Ocultar" : "Mostrar"}
                        onClick={() => setShow2((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {show2 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                {loading ? "Guardando…" : "Guardar contraseña"}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              <Link to="/admin/login" style={{ color: "inherit" }}>
                Ir al inicio de sesión
              </Link>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
