import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { es } from "date-fns/locale";
import { format, isSameDay } from "date-fns";
import { getVisits, updateVisit } from "../../api/client";
import "./VisitsPage.css";

const ESTADO_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

const statusChipColor = {
  pending: "warning",
  confirmed: "success",
  rejected: "default",
  cancelled: "default",
};

function DayWithEvents({ day, eventsByDate = {}, ...pickersDayProps }) {
  const dateKey = day ? format(day, "yyyy-MM-dd") : "";
  const dayVisits = eventsByDate[dateKey] || [];

  return (
    <Box sx={{ position: "relative" }}>
      <PickersDay day={day} {...pickersDayProps} />
      {dayVisits.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 0.25,
            justifyContent: "center",
          }}
        >
          {dayVisits.slice(0, 3).map((v) => (
            <Box
              key={v.id}
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor:
                  v.status === "confirmed"
                    ? "primary.main"
                    : v.status === "pending"
                      ? "warning.light"
                      : "grey.400",
              }}
            />
          ))}
          {dayVisits.length > 3 && (
            <Typography component="span" sx={{ fontSize: 10, color: "text.secondary" }}>
              +{dayVisits.length - 3}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default function VisitsPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [viewMode, setViewMode] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterEstado) params.status = filterEstado;
      const data = await getVisits(params);
      setVisits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterEstado]);

  const eventsByDate = useMemo(() => {
    const map = {};
    visits.forEach((v) => {
      const key = v.preferred_date?.slice(0, 10);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(v);
    });
    return map;
  }, [visits]);

  const visitsForSelectedDate = useMemo(() => {
    const sel = format(selectedDate, "yyyy-MM-dd");
    return visits.filter((v) => v.preferred_date?.slice(0, 10) === sel);
  }, [visits, selectedDate]);

  const handleConfirm = async (v) => {
    try {
      await updateVisit(v.id, { status: "confirmed" });
      setVisits((prev) => prev.map((x) => (x.id === v.id ? { ...x, status: "confirmed" } : x)));
      setDetailOpen(false);
      setSelectedVisit(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (v) => {
    try {
      await updateVisit(v.id, { status: "rejected" });
      setVisits((prev) => prev.map((x) => (x.id === v.id ? { ...x, status: "rejected" } : x)));
      setDetailOpen(false);
      setSelectedVisit(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const openDetail = (v) => {
    setSelectedVisit(v);
    setDetailOpen(true);
  };

  const listColumns = [
    {
      field: "preferred_date",
      headerName: "Fecha",
      width: 155,
      valueGetter: (_, row) =>
        row.preferred_date
          ? `${row.preferred_date} ${row.preferred_time ? `· ${row.preferred_time}` : ""}`
          : "—",
    },
    { field: "name", headerName: "Cliente", flex: 1, minWidth: 130 },
    { field: "phone", headerName: "Teléfono", width: 130 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "listing_title",
      headerName: "Propiedad",
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) =>
        row.listing_id ? (
          <Button
            component={Link}
            to={`/admin/editar/${row.listing_id}`}
            size="small"
            sx={{ textTransform: "none", px: 0 }}
          >
            {row.listing_title || `#${row.listing_id}`}
          </Button>
        ) : (
          "—"
        ),
    },
    {
      field: "status",
      headerName: "Estado",
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          label={ESTADO_LABELS[value] || value}
          size="small"
          color={statusChipColor[value] || "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 200,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Button size="small" variant="text" onClick={() => openDetail(row)}>
            Ver
          </Button>
          {row.status === "pending" && (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleConfirm(row)}
              >
                Confirmar
              </Button>
              <Button size="small" variant="outlined" onClick={() => handleReject(row)}>
                Rechazar
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <div className="visits-admin">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
        >
          Visitas
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val != null && setViewMode(val)}
            size="small"
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
          >
            <ToggleButton value="calendar">Calendario</ToggleButton>
            <ToggleButton value="list">Lista</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="filter-estado">Estado</InputLabel>
            <Select
              labelId="filter-estado"
              value={filterEstado}
              label="Estado"
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(ESTADO_LABELS).map(([k, label]) => (
                <MenuItem key={k} value={k}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      {viewMode === "calendar" ? (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
          <Paper sx={{ p: 1, flex: "0 0 auto", borderRadius: 2, boxShadow: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DateCalendar
                value={selectedDate}
                onChange={(d) => d && setSelectedDate(d)}
                showDaysOutsideCurrentMonth
                slots={{ day: DayWithEvents }}
                slotProps={{ day: { eventsByDate } }}
                sx={{
                  "& .MuiPickersDay-today": { fontWeight: 700 },
                  "& .Mui-selected": { bgcolor: "primary.main" },
                }}
              />
            </LocalizationProvider>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, borderRadius: 2, boxShadow: 1, minHeight: 400 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Visitas del {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </Typography>
            {visitsForSelectedDate.length === 0 ? (
              <Typography color="text.secondary">No hay visitas este día.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {visitsForSelectedDate.map((v) => (
                  <Box
                    key={v.id}
                    onClick={() => openDetail(v)}
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Box>
                      <Typography fontWeight={500}>{v.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {v.preferred_time ? `A las ${v.preferred_time}` : ""} ·{" "}
                        {v.listing_title || `#${v.listing_id || "—"}`}
                      </Typography>
                    </Box>
                    <Chip
                      label={ESTADO_LABELS[v.status]}
                      size="small"
                      color={statusChipColor[v.status] || "default"}
                      variant="outlined"
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ width: "100%" }}>
          <DataGrid
            rows={visits}
            columns={listColumns}
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
            localeText={{
              noRowsLabel: "No hay visitas con ese filtro.",
            }}
          />
        </Paper>
      )}

      {/* Detalle de visita */}
      <Dialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedVisit(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        {selectedVisit && (
          <>
            <DialogTitle>Detalle de visita</DialogTitle>
            <DialogContent>
              <Box
                component="dl"
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 0.5,
                  "& dt": { color: "text.secondary", fontWeight: 500 },
                  "& dd": { m: 0 },
                }}
              >
                <dt>Fecha</dt>
                <dd>
                  {selectedVisit.preferred_date}{" "}
                  {selectedVisit.preferred_time ? `a las ${selectedVisit.preferred_time}` : ""}
                </dd>
                <dt>Cliente</dt>
                <dd>{selectedVisit.name}</dd>
                <dt>Contacto</dt>
                <dd>
                  <a href={`mailto:${selectedVisit.email}`}>{selectedVisit.email}</a>
                  {selectedVisit.phone && (
                    <>
                      <br />
                      <small>{selectedVisit.phone}</small>
                    </>
                  )}
                </dd>
                <dt>Propiedad</dt>
                <dd>
                  {selectedVisit.listing_id ? (
                    <Link to={`/admin/editar/${selectedVisit.listing_id}`}>
                      {selectedVisit.listing_title || `#${selectedVisit.listing_id}`}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
                {selectedVisit.message && (
                  <>
                    <dt>Mensaje</dt>
                    <dd>{selectedVisit.message}</dd>
                  </>
                )}
                <dt>Estado</dt>
                <dd>
                  <Chip
                    label={ESTADO_LABELS[selectedVisit.status]}
                    size="small"
                    color={statusChipColor[selectedVisit.status] || "default"}
                  />
                </dd>
              </Box>
              {selectedVisit.status === "pending" && (
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleConfirm(selectedVisit)}
                  >
                    Confirmar
                  </Button>
                  <Button variant="outlined" onClick={() => handleReject(selectedVisit)}>
                    Rechazar
                  </Button>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setDetailOpen(false);
                  setSelectedVisit(null);
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
