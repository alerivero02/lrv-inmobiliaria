import { ThemeProvider, createTheme, Paper } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

const calendarTheme = createTheme({
  palette: {
    primary: { main: "#00a86b" },
    background: { paper: "#ffffff" },
  },
  typography: { fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif' },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});

export default function CalendarInline({ value, minDate, onChange, label }) {
  const dateValue = value ? new Date(`${value}T12:00:00`) : null;
  const minDateObj = minDate ? new Date(`${minDate}T12:00:00`) : null;

  return (
    <ThemeProvider theme={calendarTheme}>
      {label && (
        <label
          className="calendar-inline__label"
          style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}
        >
          {label}
        </label>
      )}
      <Paper
        variant="outlined"
        sx={{ p: 0, overflow: "hidden", borderRadius: 2, display: "inline-block" }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <DateCalendar
            value={dateValue}
            onChange={(d) => d && onChange(d)}
            minDate={minDateObj || undefined}
            disablePast={!minDate}
            showDaysOutsideCurrentMonth
            sx={{
              "& .MuiPickersDay-today": { fontWeight: 700 },
              "& .Mui-selected": { bgcolor: "primary.main", color: "white" },
            }}
          />
        </LocalizationProvider>
      </Paper>
    </ThemeProvider>
  );
}
