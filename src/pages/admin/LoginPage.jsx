import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { login, isAuthenticated } from "../../api/client";
import { AdminAuthShell } from "../../components/admin/AdminAuthShell";
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
    <AdminAuthShell
      title="LRV Admin"
      subtitle="Inmobiliaria - acceso al panel de gestion"
      footer={{ to: "/", label: "Volver al sitio publico" }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ py: 1.25 }}>
          {loading ? "Entrando…" : "Entrar al panel"}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
        <Link to="/admin/olvide-contrasena" style={{ color: "inherit", fontWeight: 600, fontSize: "0.875rem" }}>
          Olvidé mi contraseña
        </Link>
      </Typography>
    </AdminAuthShell>
  );
}
