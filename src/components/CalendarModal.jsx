import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

const calendarTheme = createTheme({
  palette: {
    primary: { main: "#00a86b" },
    background: { default: "#faf8f5", paper: "#ffffff" },
  },
  typography: { fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif' },
  shape: { borderRadius: 12 },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12, overflow: "hidden" },
      },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
  },
});

export default function CalendarModal({
  open,
  onClose,
  value,
  onAccept,
  minDate,
  title = "Elegir fecha",
  cancelLabel = "Cancelar",
  okLabel = "OK",
}) {
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : minDate ? new Date(minDate) : new Date(),
  );

  useEffect(() => {
    if (open) {
      setSelectedDate(value ? new Date(value) : minDate ? new Date(minDate) : new Date());
    }
  }, [open, value, minDate]);

  const handleOk = () => {
    onAccept(selectedDate);
    onClose();
  };

  const handleClose = () => {
    setSelectedDate(value ? new Date(value) : minDate ? new Date(minDate) : new Date());
    onClose();
  };

  return (
    <ThemeProvider theme={calendarTheme}>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
          }}
        >
          {title}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Paper variant="outlined" sx={{ p: 0, overflow: "hidden", borderRadius: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DateCalendar
                value={selectedDate}
                onChange={(d) => d && setSelectedDate(d)}
                minDate={minDate ? new Date(minDate) : undefined}
                disablePast={!minDate}
                showDaysOutsideCurrentMonth
                sx={{
                  width: "100%",
                  "& .MuiPickersDay-today": { fontWeight: 700 },
                  "& .Mui-selected": { bgcolor: "primary.main", color: "white" },
                }}
              />
            </LocalizationProvider>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 2, gap: 1, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={handleClose} variant="outlined" color="inherit">
            {cancelLabel}
          </Button>
          <Button variant="contained" onClick={handleOk} color="primary">
            {okLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
