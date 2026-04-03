import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  Snackbar,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SellIcon from "@mui/icons-material/Sell";
import { getListings, deleteListing, updateListing } from "../../api/client";
import { formatPrice } from "../../utils/format";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminSurface } from "../../components/admin/AdminSurface";

const STATUS_LABELS = {
  active: "Activo",
  paused: "Pausado",
  sold: "Vendido/Alquilado",
  archived: "Archivado",
  pending_review: "Pend. revisión",
};
const TYPE_LABELS = { casa: "Casa", departamento: "Dpto", terreno: "Terreno" };
const OPERATION_LABELS = { venta: "Venta", alquiler: "Alquiler" };
const statusColor = {
  active: "success",
  paused: "default",
  sold: "primary",
  archived: "default",
  pending_review: "warning",
};

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackMsg, setSnackMsg] = useState("");
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    property_type: "",
    operation: "",
    city: "",
    search: "",
    order_by: "updated",
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.property_type) params.property_type = filters.property_type;
      if (filters.operation) params.operation = filters.operation;
      if (filters.city) params.city = filters.city;
      if (filters.search) params.search = filters.search;
      if (filters.order_by) params.order_by = filters.order_by;
      const data = await getListings(params);
      setListings(data);
    } catch (err) {
      setError(err.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [
    filters.status,
    filters.property_type,
    filters.operation,
    filters.city,
    filters.search,
    filters.order_by,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateListing(id, { status: newStatus });
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClick = (l) => setDeleteConfirm(l);
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteListing(deleteConfirm.id);
      setListings((prev) => prev.filter((l) => l.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const processRowUpdate = async (newRow, oldRow) => {
    const changed = {};
    if (newRow.commission_buyer !== oldRow.commission_buyer)
      changed.commission_buyer = Number(newRow.commission_buyer);
    if (newRow.commission_seller !== oldRow.commission_seller)
      changed.commission_seller = Number(newRow.commission_seller);
    if (!Object.keys(changed).length) return oldRow;

    try {
      await updateListing(newRow.id, changed);
      setListings((prev) => prev.map((l) => (l.id === newRow.id ? { ...l, ...changed } : l)));
      setSnackMsg("Comisión actualizada");
      return { ...newRow, ...changed };
    } catch (err) {
      setError(err.message);
      return oldRow;
    }
  };

  const columns = [
    {
      field: "title",
      headerName: "Título",
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Button
          component={Link}
          to={`/admin/editar/${row.id}`}
          size="small"
          sx={{ textAlign: "left", textTransform: "none", justifyContent: "flex-start", px: 0 }}
        >
          {row.title}
        </Button>
      ),
    },
    {
      field: "property_type",
      headerName: "Tipo",
      width: 90,
      valueGetter: (v) => TYPE_LABELS[v] || v,
    },
    {
      field: "operation",
      headerName: "Operación",
      width: 90,
      valueGetter: (v) => OPERATION_LABELS[v] || v || "Venta",
    },
    {
      field: "city",
      headerName: "Ubicación",
      width: 140,
      valueGetter: (_, row) => [row.city, row.address].filter(Boolean).join(", ") || "—",
    },
    {
      field: "rooms",
      headerName: "Amb.",
      width: 60,
      align: "center",
      headerAlign: "center",
      type: "number",
      valueGetter: (v) => v ?? "—",
    },
    {
      field: "area_sqm",
      headerName: "m²",
      width: 70,
      align: "right",
      headerAlign: "right",
      type: "number",
      valueGetter: (v) => v ?? "—",
    },
    {
      field: "price",
      headerName: "Precio",
      width: 130,
      align: "right",
      headerAlign: "right",
      renderCell: ({ value }) => <span style={{ fontWeight: 500 }}>{formatPrice(value)}</span>,
    },
    {
      field: "view_count",
      headerName: "Vistas",
      width: 70,
      align: "center",
      headerAlign: "center",
      type: "number",
    },
    {
      field: "consult_count",
      headerName: "Consultas",
      width: 90,
      align: "center",
      headerAlign: "center",
      type: "number",
    },
    {
      field: "commission_buyer",
      headerName: "Com. Comprador %",
      width: 155,
      type: "number",
      align: "center",
      headerAlign: "center",
      editable: true,
      valueGetter: (v) => v ?? 3.0,
      renderCell: ({ value }) => (
        <Tooltip title="Doble clic para editar">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}>
            <span>{Number(value).toFixed(1)}%</span>
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "commission_seller",
      headerName: "Com. Vendedor %",
      width: 150,
      type: "number",
      align: "center",
      headerAlign: "center",
      editable: true,
      valueGetter: (v) => v ?? 3.0,
      renderCell: ({ value }) => (
        <Tooltip title="Doble clic para editar">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}>
            <span>{Number(value).toFixed(1)}%</span>
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "status",
      headerName: "Estado",
      width: 140,
      renderCell: ({ value }) => (
        <Chip
          label={STATUS_LABELS[value] || value}
          size="small"
          color={statusColor[value] || "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 170,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          {row.status === "active" && (
            <Tooltip title="Pausar">
              <IconButton size="small" onClick={() => handleStatusChange(row.id, "paused")}>
                <PauseCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.status === "paused" && (
            <Tooltip title="Activar">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleStatusChange(row.id, "active")}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.status !== "sold" && (
            <Tooltip title="Marcar como vendido">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleStatusChange(row.id, "sold")}
              >
                <SellIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <IconButton component={Link} to={`/admin/editar/${row.id}`} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <AdminPageHeader
        title="Anuncios"
        subtitle="Gestioná el portfolio: filtros, comisiones editables en tabla y estados en un clic."
        actions={
          <Button component={Link} to="/admin/nuevo" variant="contained" startIcon={<AddIcon />} size="medium">
            Nuevo anuncio
          </Button>
        }
      />

      <AdminSurface className="mb-6">
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}
        >
          <TextField
            placeholder="Buscar título, descripción, ciudad..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            size="small"
            sx={{ minWidth: { xs: "100%", sm: 240 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 110 } }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filters.property_type}
              label="Tipo"
              onChange={(e) => setFilters((f) => ({ ...f, property_type: e.target.value }))}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="casa">Casa</MenuItem>
              <MenuItem value="departamento">Departamento</MenuItem>
              <MenuItem value="terreno">Terreno</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 110 } }}>
            <InputLabel>Operación</InputLabel>
            <Select
              value={filters.operation}
              label="Operación"
              onChange={(e) => setFilters((f) => ({ ...f, operation: e.target.value }))}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="venta">Venta</MenuItem>
              <MenuItem value="alquiler">Alquiler</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.status}
              label="Estado"
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={filters.order_by}
              label="Ordenar por"
              onChange={(e) => setFilters((f) => ({ ...f, order_by: e.target.value }))}
            >
              <MenuItem value="updated">Más recientes</MenuItem>
              <MenuItem value="views">Más visualizaciones</MenuItem>
              <MenuItem value="consults">Más consultas</MenuItem>
              <MenuItem value="destacadas">Destacadas</MenuItem>
            </Select>
          </FormControl>
          <TextField
            placeholder="Ciudad"
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            size="small"
            sx={{ minWidth: { xs: "100%", sm: 110 } }}
          />
          <Button type="submit" variant="contained">
            Buscar
          </Button>
        </Box>
      </AdminSurface>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <AdminSurface className="w-full min-w-0 overflow-hidden py-0" contentClassName="p-0">
        <div className="min-w-0 w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <DataGrid
            rows={listings}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(err) => setError(err.message)}
            sx={{
              border: "none",
              minWidth: 720,
              height: { xs: 480, sm: 520, md: 600 },
              "& .MuiDataGrid-main": { borderRadius: 0 },
              "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" },
              "& .MuiDataGrid-cell--editable": {
                outline: "1px dashed",
                outlineColor: "primary.light",
                cursor: "pointer",
              },
            }}
            localeText={{
              noRowsLabel: "No hay anuncios con esos filtros.",
              footerRowSelected: (c) => `${c} fila(s) seleccionada(s)`,
            }}
          />
        </div>
      </AdminSurface>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>¿Eliminar anuncio?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteConfirm &&
              `Se eliminará "${deleteConfirm.title}". Esta acción no se puede deshacer.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={3000}
        onClose={() => setSnackMsg("")}
        message={snackMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
