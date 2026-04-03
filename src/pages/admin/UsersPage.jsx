import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { getUsers, inviteUser, resendUserInvite } from "../../api/client";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminSurface } from "../../components/admin/AdminSurface";

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [snack, setSnack] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers();
      setRows(data);
    } catch (e) {
      setError(e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setError("");
    try {
      const r = await inviteUser(email.trim(), role);
      setSnack(r.detail || "Listo");
      setEmail("");
      await load();
    } catch (e2) {
      setError(e2.message || "Error");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResend = async (id) => {
    try {
      const r = await resendUserInvite(id);
      setSnack(r.detail || "Reenviado");
    } catch (e) {
      setError(e.message || "Error al reenviar");
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "email", headerName: "Correo", flex: 1, minWidth: 200 },
    {
      field: "role",
      headerName: "Rol",
      width: 110,
      valueGetter: (v) => (v === "admin" ? "Admin" : "Staff"),
    },
    {
      field: "email_verified",
      headerName: "Estado",
      width: 130,
      valueGetter: (_, row) => (row.email_verified ? "Activo" : "Pendiente"),
    },
    {
      field: "actions",
      headerName: "",
      width: 140,
      sortable: false,
      renderCell: ({ row }) =>
        !row.email_verified && row.pending_activation ? (
          <Button
            size="small"
            startIcon={<MailOutlineIcon />}
            onClick={() => handleResend(row.id)}
          >
            Reenviar
          </Button>
        ) : null,
    },
  ];

  return (
    <Box>
      <AdminPageHeader
        title="Usuarios del panel"
        subtitle="Invitá colaboradores por correo. Deben abrir el enlace y definir una contraseña segura antes de poder entrar."
      />

      <AdminSurface sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Nueva invitación
        </Typography>
        <Box
          component="form"
          onSubmit={handleInvite}
          sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}
        >
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ minWidth: 260, flex: 1 }}
            disabled={inviteLoading}
            autoComplete="off"
          />
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel id="role-label">Rol</InputLabel>
            <Select
              labelId="role-label"
              label="Rol"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={inviteLoading}
            >
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" disabled={inviteLoading}>
            {inviteLoading ? "Enviando…" : "Enviar invitación"}
          </Button>
        </Box>
      </AdminSurface>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <AdminSurface sx={{ overflow: "hidden", width: "100%", p: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          getRowId={(r) => r.id}
          sx={{ border: "none", height: 440 }}
        />
      </AdminSurface>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={6000}
        onClose={() => setSnack("")}
        message={snack}
      />
    </Box>
  );
}
