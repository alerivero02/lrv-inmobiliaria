import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { requestPasswordReset, isAuthenticated } from "../../api/client";
import { adminTheme } from "../../theme/adminTheme";

export default function ForgotPasswordPage() {
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
              Olvidé mi contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
              Te enviamos un enlace si hay una cuenta activa con ese correo.
            </Typography>

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

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              <Link to="/admin/login" style={{ color: "inherit" }}>
                Volver al inicio de sesión
              </Link>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
