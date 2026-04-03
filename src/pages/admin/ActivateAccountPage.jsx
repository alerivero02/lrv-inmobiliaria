import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
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
import { completeAccountActivation, isAuthenticated } from "../../api/client";
import { AdminAuthShell } from "../../components/admin/AdminAuthShell";
import { useSeo } from "../../hooks/useSeo";

export default function ActivateAccountPage() {
  useSeo({
    title: "Activar cuenta",
    description: "Activación de cuenta LRV Inmobiliaria.",
    canonicalPath: "/admin/activar-cuenta",
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
      setError("Falta el enlace de activación. Abrí el enlace completo que recibiste por correo.");
      return;
    }
    setLoading(true);
    try {
      const r = await completeAccountActivation(token, password);
      setSuccess(r.detail || "Cuenta activada.");
      setTimeout(() => navigate("/admin/login", { replace: true }), 2000);
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthShell
      title="Activar cuenta"
      subtitle="Elegí una contraseña segura para el panel LRV."
      footer={{ to: "/admin/login", label: "Ir al inicio de sesión" }}
    >
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
        Mínimo 12 caracteres, mayúsculas, minúsculas, un número y un símbolo.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label="Contraseña"
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
          {loading ? "Guardando…" : "Activar y continuar"}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
        <Link to="/" style={{ color: "inherit" }}>
          Sitio público
        </Link>
      </Typography>
    </AdminAuthShell>
  );
}
