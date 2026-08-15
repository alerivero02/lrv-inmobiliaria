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
  Menu,
  ListItemIcon,
  ListItemText,
  Typography,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SellIcon from "@mui/icons-material/Sell";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import { getListings, deleteListing, updateListing } from "../../api/client";
import { formatPrice } from "../../utils/format";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminSurface } from "../../components/admin/AdminSurface";
import { PROPERTY_TYPES, INVESTMENT_TAGS, TYPE_LABELS, INVESTMENT_TAG_LABELS } from "../../data/propertyTypes";
import { MAX_FEATURED_LISTINGS } from "../../constants/featured";

const STATUS_LABELS = {
  active: "Activo",
  paused: "Pausado",
  sold: "Vendido/Alquilado",
  archived: "Archivado",
  pending_review: "Pend. revisión",
};
const OPERATION_LABELS = { venta: "Venta", alquiler: "Alquiler" };
const statusColor = {
  active: "success",
  paused: "default",
  sold: "primary",
  archived: "default",
  pending_review: "warning",
};

const COLUMN_STORAGE_KEY = "lrv-admin-listings-columns";

const OPTIONAL_COLUMNS = [
  { id: "property_specs", label: "Ambientes y m²" },
  { id: "engagement", label: "Vistas y consultas" },
  { id: "commissions", label: "Comisiones", fields: ["commission_buyer", "commission_seller"] },
];

const DEFAULT_COLUMN_VISIBILITY = {
  property_specs: false,
  engagement: false,
  commission_buyer: false,
  commission_seller: false,
};

function loadColumnVisibility() {
  try {
    const stored = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!stored) return DEFAULT_COLUMN_VISIBILITY;
    return { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_COLUMN_VISIBILITY;
  }
}

function formatListingDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

const cellEllipsisSx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
  width: "100%",
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
    investment_tag: "",
    operation: "",
    city: "",
    search: "",
    order_by: "updated",
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState(loadColumnVisibility);
  const [columnsMenuAnchor, setColumnsMenuAnchor] = useState(null);
  const [rowMenu, setRowMenu] = useState({ anchor: null, row: null });

  const toggleOptionalColumn = (option, checked) => {
    setColumnVisibility((prev) => {
      const next = { ...prev };
      if (option.fields) {
        for (const field of option.fields) next[field] = checked;
      } else {
        next[option.id] = checked;
      }
      try {
        localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isOptionalColumnChecked = (option) => {
    if (option.fields) return option.fields.every((f) => columnVisibility[f] !== false);
    return columnVisibility[option.id] !== false;
  };

  const closeRowMenu = () => setRowMenu({ anchor: null, row: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.property_type) params.property_type = filters.property_type;
      if (filters.investment_tag) params.investment_tag = filters.investment_tag;
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
    filters.investment_tag,
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

  const handleToggleFeatured = async (row) => {
    const featuredCount = listings.filter((l) => l.featured).length;
    if (!row.featured && featuredCount >= MAX_FEATURED_LISTINGS) {
      setError(
        `Ya hay ${MAX_FEATURED_LISTINGS} anuncios destacados. Quitá uno antes de agregar otro.`,
      );
      return;
    }
    try {
      const updated = await updateListing(row.id, { featured: !row.featured });
      setListings((prev) => prev.map((l) => (l.id === row.id ? updated : l)));
      setSnackMsg(!row.featured ? "Anuncio marcado como destacado" : "Destacado quitado");
    } catch (err) {
      setError(err.message || "No se pudo actualizar destacado");
    }
  };

  const menuRow = rowMenu.row;

  const columns = [
    {
      field: "title",
      headerName: "Título",
      flex: 1,
      minWidth: 140,
      disableColumnMenu: true,
      renderCell: ({ row }) => (
        <Tooltip title={row.title} enterDelay={400}>
          <Button
            component={Link}
            to={`/admin/editar/${row.id}`}
            size="small"
            sx={{
              textAlign: "left",
              textTransform: "none",
              justifyContent: "flex-start",
              px: 0,
              maxWidth: "100%",
              minWidth: 0,
              color: "text.primary",
              fontWeight: 500,
            }}
          >
            <Box component="span" sx={cellEllipsisSx}>
              {row.title}
            </Box>
          </Button>
        </Tooltip>
      ),
    },
    {
      field: "property_summary",
      headerName: "Tipo",
      width: 108,
      sortable: false,
      disableColumnMenu: true,
      valueGetter: (_, row) => {
        const type = TYPE_LABELS[row.property_type] || row.property_type || "—";
        const op = OPERATION_LABELS[row.operation] || row.operation || "Venta";
        const inv = INVESTMENT_TAG_LABELS[row.investment_tag];
        return inv ? `${type} · ${op} · ${inv}` : `${type} · ${op}`;
      },
      renderCell: ({ value }) => (
        <Tooltip title={value}>
          <Typography variant="body2" sx={cellEllipsisSx}>
            {value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "city",
      headerName: "Ubicación",
      flex: 0.55,
      minWidth: 96,
      maxWidth: 200,
      disableColumnMenu: true,
      valueGetter: (_, row) => [row.city, row.address].filter(Boolean).join(", ") || "—",
      renderCell: ({ value }) => (
        <Tooltip title={value}>
          <Typography variant="body2" color="text.secondary" sx={cellEllipsisSx}>
            {value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "property_specs",
      headerName: "Ficha",
      width: 76,
      align: "center",
      headerAlign: "center",
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) => {
        const amb = row.rooms != null ? `${row.rooms} amb` : "—";
        const m2 = row.area_sqm != null ? `${row.area_sqm} m²` : "—";
        const label = `${amb} · ${m2}`;
        return (
          <Tooltip title={label}>
            <Typography variant="caption" sx={cellEllipsisSx}>
              {label}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: "price",
      headerName: "Precio",
      width: 112,
      align: "right",
      headerAlign: "right",
      disableColumnMenu: true,
      renderCell: ({ row }) => (
        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
          {formatPrice(row.price, row.currency)}
        </Typography>
      ),
    },
    {
      field: "engagement",
      headerName: "Métricas",
      width: 88,
      align: "center",
      headerAlign: "center",
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) => {
        const label = `${row.view_count ?? 0} vistas · ${row.consult_count ?? 0} consultas`;
        return (
          <Tooltip title={label}>
            <Typography variant="caption" sx={{ lineHeight: 1.3, whiteSpace: "nowrap" }}>
              <Box component="span" sx={{ display: "block" }}>
                {row.view_count ?? 0} v.
              </Box>
              <Box component="span" sx={{ display: "block", color: "text.secondary" }}>
                {row.consult_count ?? 0} c.
              </Box>
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: "commission_buyer",
      headerName: "Com. comprador",
      width: 108,
      type: "number",
      align: "center",
      headerAlign: "center",
      editable: true,
      valueGetter: (v) => v ?? 3.0,
      renderCell: ({ value }) => (
        <Tooltip title="Doble clic para editar">
          <Typography variant="caption" sx={{ cursor: "pointer" }}>
            {Number(value).toFixed(1)}%
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "commission_seller",
      headerName: "Com. vendedor",
      width: 104,
      type: "number",
      align: "center",
      headerAlign: "center",
      editable: true,
      valueGetter: (v) => v ?? 3.0,
      renderCell: ({ value }) => (
        <Tooltip title="Doble clic para editar">
          <Typography variant="caption" sx={{ cursor: "pointer" }}>
            {Number(value).toFixed(1)}%
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "status_meta",
      headerName: "Estado",
      width: 124,
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0, py: 0.5 }}>
          <Chip
            label={STATUS_LABELS[row.status] || row.status}
            size="small"
            color={statusColor[row.status] || "default"}
            variant="outlined"
            sx={{ height: 22, maxWidth: "100%", "& .MuiChip-label": { px: 0.75, fontSize: "0.7rem" } }}
          />
          <Tooltip title={`Actualizado: ${formatListingDate(row.updated_at)}`}>
            <Typography variant="caption" color="text.secondary" sx={cellEllipsisSx}>
              {formatListingDate(row.updated_at)}
            </Typography>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 48,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <Tooltip title="Acciones">
          <IconButton
            size="small"
            aria-label="Acciones del anuncio"
            onClick={(e) => {
              e.stopPropagation();
              setRowMenu({ anchor: e.currentTarget, row });
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <AdminPageHeader
        title="Anuncios"
        subtitle="Tabla compacta: configurá columnas opcionales y acciones desde el menú ⋮."
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
              {PROPERTY_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
            <InputLabel>Inversión</InputLabel>
            <Select
              value={filters.investment_tag}
              label="Inversión"
              onChange={(e) => setFilters((f) => ({ ...f, investment_tag: e.target.value }))}
            >
              <MenuItem value="">Todas</MenuItem>
              {INVESTMENT_TAGS.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            px: 1.5,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Button
            size="small"
            variant="text"
            startIcon={<ViewColumnOutlinedIcon fontSize="small" />}
            onClick={(e) => setColumnsMenuAnchor(e.currentTarget)}
          >
            Columnas
          </Button>
          <Menu
            anchorEl={columnsMenuAnchor}
            open={Boolean(columnsMenuAnchor)}
            onClose={() => setColumnsMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { minWidth: 220, py: 0.5 } } }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.75, display: "block" }}>
              Columnas opcionales
            </Typography>
            <Divider />
            <Box sx={{ px: 1, py: 0.5 }} onClick={(e) => e.stopPropagation()}>
              {OPTIONAL_COLUMNS.map((option) => (
                <FormControlLabel
                  key={option.id}
                  sx={{ m: 0, width: "100%", px: 1, py: 0.25, display: "flex" }}
                  control={
                    <Checkbox
                      size="small"
                      checked={isOptionalColumnChecked(option)}
                      onChange={(e) => toggleOptionalColumn(option, e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">{option.label}</Typography>}
                />
              ))}
            </Box>
          </Menu>
        </Box>
        <Box className="min-w-0 w-full">
          <DataGrid
            rows={listings}
            columns={columns}
            columnVisibilityModel={columnVisibility}
            onColumnVisibilityModelChange={(model) => {
              setColumnVisibility(model);
              try {
                localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(model));
              } catch {
                /* ignore */
              }
            }}
            loading={loading}
            disableRowSelectionOnClick
            disableColumnSelector
            disableColumnMenu
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(err) => setError(err.message)}
            rowHeight={56}
            sx={{
              border: "none",
              width: "100%",
              height: { xs: 480, sm: 520, md: 600 },
              "& .MuiDataGrid-main": { borderRadius: 0 },
              "& .MuiDataGrid-columnHeader": { px: 1 },
              "& .MuiDataGrid-cell": {
                alignItems: "center",
                display: "flex",
                px: 1,
                py: 0.5,
              },
              "& .MuiDataGrid-cell--editable": {
                outline: "1px dashed",
                outlineColor: "primary.light",
                cursor: "pointer",
              },
              "& .MuiDataGrid-virtualScroller": { overflowX: "hidden !important" },
            }}
            localeText={{
              noRowsLabel: "No hay anuncios con esos filtros.",
              footerRowSelected: (c) => `${c} fila(s) seleccionada(s)`,
            }}
          />
        </Box>
      </AdminSurface>

      <Menu
        anchorEl={rowMenu.anchor}
        open={Boolean(rowMenu.anchor && menuRow)}
        onClose={closeRowMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        {menuRow && (
          <>
            <MenuItem
              onClick={() => {
                handleToggleFeatured(menuRow);
                closeRowMenu();
              }}
            >
              <ListItemIcon>
                {menuRow.featured ? (
                  <StarIcon fontSize="small" color="warning" />
                ) : (
                  <StarBorderIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                {menuRow.featured ? "Quitar destacado" : "Marcar como destacado"}
              </ListItemText>
            </MenuItem>
            {menuRow.status === "active" && (
              <MenuItem
                onClick={() => {
                  handleStatusChange(menuRow.id, "paused");
                  closeRowMenu();
                }}
              >
                <ListItemIcon>
                  <PauseCircleOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Pausar</ListItemText>
              </MenuItem>
            )}
            {menuRow.status === "paused" && (
              <MenuItem
                onClick={() => {
                  handleStatusChange(menuRow.id, "active");
                  closeRowMenu();
                }}
              >
                <ListItemIcon>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText>Activar</ListItemText>
              </MenuItem>
            )}
            {menuRow.status !== "sold" && (
              <MenuItem
                onClick={() => {
                  handleStatusChange(menuRow.id, "sold");
                  closeRowMenu();
                }}
              >
                <ListItemIcon>
                  <SellIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText>Marcar como vendido</ListItemText>
              </MenuItem>
            )}
            <Divider />
            <MenuItem component={Link} to={`/admin/editar/${menuRow.id}`} onClick={closeRowMenu}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDeleteClick(menuRow);
                closeRowMenu();
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon>
                <DeleteOutlineIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Eliminar</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

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
