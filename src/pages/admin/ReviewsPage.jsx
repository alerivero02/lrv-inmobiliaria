import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  createReviewInvite,
  deleteReview,
  getReviewInvites,
  getReviews,
  updateReview,
} from "../../api/client";
import { getSiteBaseUrl } from "../../config/agency";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminSurface } from "../../components/admin/AdminSurface";

const STATUS_LABELS = {
  pending: "Pendiente",
  published: "Publicada",
  rejected: "Rechazada",
};

const STATUS_COLORS = {
  pending: "warning",
  published: "success",
  rejected: "default",
};

function invitePublicUrl(token) {
  const base = getSiteBaseUrl() || window.location.origin;
  return `${base}/#resenas?invite=${encodeURIComponent(token)}`;
}

export default function ReviewsPage() {
  const [rows, setRows] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("pending");
  const [snack, setSnack] = useState("");
  const [inviteForm, setInviteForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    note: "",
  });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [lastLink, setLastLink] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (status) params.status = status;
      const [reviews, openInvites] = await Promise.all([
        getReviews(params),
        getReviewInvites({ open: "1" }),
      ]);
      setRows(reviews);
      setInvites(openInvites);
    } catch (e) {
      setError(e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const setReviewStatus = async (id, next) => {
    try {
      await updateReview(id, { status: next });
      setSnack(next === "published" ? "Reseña publicada" : "Reseña actualizada");
      await load();
    } catch (e) {
      setError(e.message || "Error");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar esta reseña?")) return;
    try {
      await deleteReview(id);
      setSnack("Reseña eliminada");
      await load();
    } catch (e) {
      setError(e.message || "Error al eliminar");
    }
  };

  const createInvite = async (e) => {
    e.preventDefault();
    setInviteBusy(true);
    setError("");
    try {
      const invite = await createReviewInvite({
        client_name: inviteForm.client_name.trim(),
        client_email: inviteForm.client_email.trim() || undefined,
        client_phone: inviteForm.client_phone.trim() || undefined,
        note: inviteForm.note.trim() || undefined,
      });
      const link = invitePublicUrl(invite.token);
      setLastLink(link);
      try {
        await navigator.clipboard.writeText(link);
        setSnack("Link copiado. Enviáselo al cliente (WhatsApp / email).");
      } catch {
        setSnack("Invitación creada. Copiá el link de abajo.");
      }
      setInviteForm({ client_name: "", client_email: "", client_phone: "", note: "" });
      await load();
    } catch (err) {
      setError(err.message || "No se pudo crear la invitación");
    } finally {
      setInviteBusy(false);
    }
  };

  const copyLink = async (token) => {
    const link = invitePublicUrl(token);
    try {
      await navigator.clipboard.writeText(link);
      setSnack("Link copiado");
    } catch {
      setLastLink(link);
      setSnack("No se pudo copiar; usá el link mostrado");
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "rating",
      headerName: "Nota",
      width: 80,
      valueGetter: (_, row) => `${row.rating}/5`,
    },
    { field: "author_name", headerName: "Nombre", width: 140 },
    { field: "author_email", headerName: "Email", flex: 0.8, minWidth: 160 },
    {
      field: "body",
      headerName: "Reseña",
      flex: 1.4,
      minWidth: 220,
    },
    {
      field: "via",
      headerName: "Origen",
      width: 110,
      valueGetter: (_, row) => (row.invite_id ? "Invitación" : row.visit_id ? "Visita" : "—"),
    },
    {
      field: "status",
      headerName: "Estado",
      width: 120,
      renderCell: ({ value }) => (
        <Chip size="small" label={STATUS_LABELS[value] || value} color={STATUS_COLORS[value] || "default"} />
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 260,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {row.status !== "published" && (
            <Button size="small" onClick={() => setReviewStatus(row.id, "published")}>
              Publicar
            </Button>
          )}
          {row.status !== "rejected" && (
            <Button size="small" color="inherit" onClick={() => setReviewStatus(row.id, "rejected")}>
              Rechazar
            </Button>
          )}
          {row.status === "rejected" && (
            <Button size="small" onClick={() => setReviewStatus(row.id, "pending")}>
              Pendiente
            </Button>
          )}
          <Button size="small" color="error" onClick={() => remove(row.id)}>
            Borrar
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <AdminPageHeader
        title="Reseñas"
        subtitle="Al cerrar una venta, generá un link único para que el cliente califique. También valen visitas confirmadas. En la web: top 3 con 4–5 estrellas."
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <AdminSurface>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Invitar reseña (post-venta)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Para clientes que no usaron la web: creá el link y mandáselo por WhatsApp o email.
        </Typography>
        <Box
          component="form"
          onSubmit={createInvite}
          sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-start", mb: 2 }}
        >
          <TextField
            required
            size="small"
            label="Nombre del cliente"
            value={inviteForm.client_name}
            onChange={(e) => setInviteForm((f) => ({ ...f, client_name: e.target.value }))}
            sx={{ minWidth: 180 }}
          />
          <TextField
            size="small"
            label="Email (opcional)"
            type="email"
            value={inviteForm.client_email}
            onChange={(e) => setInviteForm((f) => ({ ...f, client_email: e.target.value }))}
            sx={{ minWidth: 200 }}
          />
          <TextField
            size="small"
            label="Teléfono (opcional)"
            value={inviteForm.client_phone}
            onChange={(e) => setInviteForm((f) => ({ ...f, client_phone: e.target.value }))}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label="Nota interna"
            value={inviteForm.note}
            onChange={(e) => setInviteForm((f) => ({ ...f, note: e.target.value }))}
            sx={{ minWidth: 160 }}
          />
          <Button type="submit" variant="contained" disabled={inviteBusy}>
            {inviteBusy ? "Creando…" : "Generar link"}
          </Button>
        </Box>
        {lastLink && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Link: <code style={{ wordBreak: "break-all" }}>{lastLink}</code>
          </Alert>
        )}
        {invites.length > 0 && (
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography variant="subtitle2">Invitaciones abiertas</Typography>
            {invites.map((inv) => (
              <Box
                key={inv.id}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  py: 0.75,
                }}
              >
                <Typography variant="body2">
                  <strong>{inv.client_name}</strong>
                  {inv.client_email ? ` · ${inv.client_email}` : ""}
                  {inv.note ? ` · ${inv.note}` : ""}
                </Typography>
                <Button size="small" onClick={() => copyLink(inv.token)}>
                  Copiar link
                </Button>
              </Box>
            ))}
          </Box>
        )}
        </AdminSurface>
      </Box>

      <AdminSurface>
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Estado</InputLabel>
            <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="pending">Pendientes</MenuItem>
              <MenuItem value="published">Publicadas</MenuItem>
              <MenuItem value="rejected">Rechazadas</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {rows.length} reseña(s)
          </Typography>
        </Box>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          getRowHeight={() => "auto"}
          sx={{
            "& .MuiDataGrid-cell": { py: 1, alignItems: "flex-start" },
          }}
        />
      </AdminSurface>
      <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack("")} message={snack} />
    </Box>
  );
}
