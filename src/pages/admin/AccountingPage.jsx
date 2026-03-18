import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  getTransactions,
  getBalance,
  getListings,
  createTransaction,
  deleteTransaction,
  exportTransactionsCsv,
} from "../../api/client";

const CATEGORIES = [
  "mantenimiento",
  "comisiones",
  "impuestos",
  "alquiler_cobrado",
  "venta",
  "otros_gastos",
  "otros_ingresos",
];

export default function AccountingPage() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ type: "", listing_id: "", from: "", to: "" });
  const [form, setForm] = useState({
    listing_id: "",
    type: "expense",
    category: "mantenimiento",
    amount: "",
    description: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.listing_id) params.listing_id = filters.listing_id;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const [txs, bal] = await Promise.all([getTransactions(params), getBalance(params)]);
      setTransactions(Array.isArray(txs) ? txs : []);
      setBalance(bal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.type, filters.listing_id, filters.from, filters.to]);

  useEffect(() => {
    getListings({ limit: 500 })
      .then((d) => setListings(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setError("");
    try {
      await createTransaction({
        listing_id: form.listing_id ? parseInt(form.listing_id, 10) : null,
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        description: form.description || null,
      });
      setForm({
        listing_id: "",
        type: "expense",
        category: "mantenimiento",
        amount: "",
        description: "",
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteTransaction(deleteId);
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const blob = await exportTransactionsCsv(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transacciones.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      field: "date",
      headerName: "Fecha",
      width: 110,
      valueFormatter: (v) =>
        v
          ? new Date(v).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "—",
    },
    {
      field: "type",
      headerName: "Tipo",
      width: 110,
      renderCell: ({ value }) => (
        <Chip
          label={value === "income" ? "Ingreso" : "Gasto"}
          size="small"
          color={value === "income" ? "success" : "error"}
          variant="outlined"
        />
      ),
    },
    {
      field: "category",
      headerName: "Categoría",
      width: 140,
      valueFormatter: (v) => v?.replace(/_/g, " ") ?? "—",
    },
    {
      field: "listing_id",
      headerName: "Propiedad",
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => listings.find((l) => l.id === row.listing_id)?.title || "—",
    },
    {
      field: "amount",
      headerName: "Monto",
      width: 140,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <Typography
          variant="body2"
          fontWeight={500}
          color={row.type === "income" ? "success.main" : "error.main"}
        >
          {row.type === "income" ? "+" : "-"} ${Number(row.amount).toLocaleString("es-AR")}
        </Typography>
      ),
    },
    {
      field: "description",
      headerName: "Descripción",
      flex: 1,
      minWidth: 140,
      valueGetter: (v) => v || "—",
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      sortable: false,
      renderCell: ({ row }) => (
        <Button
          size="small"
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={() => setDeleteId(row.id)}
        >
          Eliminar
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Contabilidad
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cerrar" : "Nuevo movimiento"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exportando…" : "Exportar CSV"}
          </Button>
        </Box>
      </Box>

      {/* Balance cards */}
      {balance != null && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Ingresos", value: balance.income, color: "success.main" },
            { label: "Egresos", value: balance.expense, color: "error.main" },
            {
              label: "Balance",
              value: balance.balance,
              color: balance.balance >= 0 ? "success.main" : "error.main",
            },
          ].map(({ label, value, color }) => (
            <Grid item xs={12} sm={4} key={label}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h6" fontWeight={700} color={color}>
                  ${Number(value).toLocaleString("es-AR")}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* New transaction form */}
      {showForm && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Nuevo movimiento
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}
          >
            <FormControl size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={form.type}
                label="Tipo"
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <MenuItem value="expense">Gasto</MenuItem>
                <MenuItem value="income">Ingreso</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={form.category}
                label="Categoría"
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Propiedad (opcional)</InputLabel>
              <Select
                value={form.listing_id}
                label="Propiedad (opcional)"
                onChange={(e) => setForm((f) => ({ ...f, listing_id: e.target.value }))}
              >
                <MenuItem value="">—</MenuItem>
                {listings.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Monto *"
              type="number"
              inputProps={{ step: 0.01, min: 0.01 }}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
              size="small"
            />
            <TextField
              label="Descripción *"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              size="small"
            />
            <Button type="submit" variant="contained">
              Guardar
            </Button>
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 120 } }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filters.type}
              label="Tipo"
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="income">Ingreso</MenuItem>
              <MenuItem value="expense">Gasto</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
            <InputLabel>Propiedad</InputLabel>
            <Select
              value={filters.listing_id}
              label="Propiedad"
              onChange={(e) => setFilters((f) => ({ ...f, listing_id: e.target.value }))}
            >
              <MenuItem value="">Todas</MenuItem>
              {listings.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="date"
            size="small"
            label="Desde"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined">
        <DataGrid
          rows={transactions}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeader": { bgcolor: "action.hover" },
            "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" },
          }}
          localeText={{ noRowsLabel: "No hay movimientos." }}
        />
      </Paper>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>¿Eliminar movimiento?</DialogTitle>
        <DialogContent>
          <DialogContentText>Esta acción no se puede deshacer.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
