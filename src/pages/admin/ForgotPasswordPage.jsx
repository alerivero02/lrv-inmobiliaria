import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { requestPasswordReset, isAuthenticated } from "../../api/client";
import { AdminAuthShell } from "../../components/admin/AdminAuthShell";
import { useSeo } from "../../hooks/useSeo";

export default function ForgotPasswordPage() {
  useSeo({
    title: "Olvidé mi contraseña",
    description: "Recuperar acceso al panel LRV Inmobiliaria.",
    canonicalPath: "/admin/olvide-contrasena",
    noIndex: true,
  });

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const r = await requestPasswordReset(email.trim());
      setSuccess(r.detail || "Listo");
      setEmail("");
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthShell
      title="Recuperar contraseña"
      subtitle="Te enviamos un enlace si hay una cuenta activa con ese correo."
      footer={{ to: "/admin/login", label: "Volver al inicio de sesión" }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          disabled={loading}
          autoComplete="email"
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
          {loading ? "Enviando…" : "Enviar enlace"}
        </Button>
      </Box>
    </AdminAuthShell>
  );
}
