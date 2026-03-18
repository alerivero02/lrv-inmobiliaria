import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
  Skeleton,
  Alert,
  Divider,
  useTheme,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SavingsIcon from "@mui/icons-material/Savings";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import PercentIcon from "@mui/icons-material/Percent";
import BarChartIcon from "@mui/icons-material/BarChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { getDashboardStats, getVisitsByListing } from "../../api/client";

const fmt = (n) => (n ?? 0).toLocaleString("es-AR");
const fmtARS = (n) => `$\u00a0${fmt(Math.round(n ?? 0))}`;

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const theme = useTheme();

  useEffect(() => {
    Promise.all([getDashboardStats(), getVisitsByListing({ limit: 10 })])
      .then(([s, r]) => {
        setStats(s);
        setRanking(r);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

  // ── Tarjetas operativas ────────────────────────────────────────────
  const operativeCards = [
    {
      label: "Propiedades activas",
      value: stats.active_listings,
      icon: <HomeWorkIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: "Visitas del mes",
      value: stats.visits_this_month,
      icon: <EventAvailableIcon />,
      color: theme.palette.info.main,
    },
    {
      label: "Pendientes de confirmar",
      value: stats.pending_visits,
      icon: <PendingActionsIcon />,
      color: theme.palette.warning.main,
      warn: true,
    },
    {
      label: "Vendidas / alquiladas",
      value: stats.sold_listings,
      icon: <AttachMoneyIcon />,
      color: theme.palette.success.main,
    },
    {
      label: "Tasa de conversión",
      value: `${stats.conversion_rate}%`,
      icon: <TrendingUpIcon />,
      color: theme.palette.secondary.main,
    },
  ];

  // ── Tarjetas financieras del portfolio ────────────────────────────
  const portfolioCards = [
    {
      label: "Valor total del portfolio",
      value: fmtARS(stats.portfolio_value),
      subtext: `${stats.listings_with_price} prop. con precio`,
      icon: <AccountBalanceIcon />,
      color: "#2e7d32",
      bg: "#f1f8e9",
    },
    {
      label: "Margen potencial total",
      value: fmtARS(stats.potential_margin),
      subtext: "Comisiones comprador + vendedor",
      icon: <SavingsIcon />,
      color: "#1565c0",
      bg: "#e3f2fd",
    },
    {
      label: "Com. comprador (potencial)",
      value: fmtARS(stats.commission_buyer_total),
      subtext: `Sobre propiedades activas`,
      icon: <PercentIcon />,
      color: "#6a1b9a",
      bg: "#f3e5f5",
    },
    {
      label: "Com. vendedor (potencial)",
      value: fmtARS(stats.commission_seller_total),
      subtext: `Sobre propiedades activas`,
      icon: <PercentIcon />,
      color: "#e65100",
      bg: "#fff3e0",
    },
    {
      label: "Precio promedio",
      value: fmtARS(stats.avg_listing_price),
      subtext: "Propiedades activas con precio",
      icon: <BarChartIcon />,
      color: "#00695c",
      bg: "#e0f2f1",
    },
    {
      label: "Comisiones ganadas (vendidas)",
      value: fmtARS(stats.sold_commission_earned),
      subtext: `Portfolio vendido: ${fmtARS(stats.sold_portfolio_value)}`,
      icon: <PriceCheckIcon />,
      color: "#c62828",
      bg: "#ffebee",
    },
  ];

  // ── Datos gráfico finanzas del mes ────────────────────────────────
  const financeData = [
    { label: "Ingresos", value: stats.income_this_month ?? 0 },
    { label: "Egresos", value: stats.expense_this_month ?? 0 },
    { label: "Balance", value: stats.balance_this_month ?? 0 },
  ];
  const financeColors = [
    theme.palette.success.main,
    theme.palette.error.main,
    (stats.balance_this_month ?? 0) >= 0 ? theme.palette.info.main : theme.palette.warning.main,
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* ── Tarjetas operativas ───────────────────────────────────── */}
      <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        Actividad operativa
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {operativeCards.map((c) => (
          <Grid item xs={6} sm={4} md={12 / 5} key={c.label}>
            <Card variant="outlined" sx={{ height: "100%", borderLeft: `4px solid ${c.color}` }}>
              <CardContent sx={{ pb: "12px !important" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.3, mb: 0.5 }}
                    >
                      {c.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={c.warn ? "warning.main" : "text.primary"}
                    >
                      {c.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: c.color, opacity: 0.7, mt: 0.5 }}>{c.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Tarjetas financieras del portfolio ───────────────────── */}
      <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        Prospecto financiero del portfolio
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {portfolioCards.map((c) => (
          <Grid item xs={12} sm={6} md={4} key={c.label}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderLeft: `4px solid ${c.color}`,
                background: c.bg,
                borderColor: c.color + "40",
              }}
            >
              <CardContent sx={{ pb: "12px !important" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.3, mb: 0.5 }}
                    >
                      {c.label}
                    </Typography>
                    <Typography
                      fontWeight={700}
                      sx={{
                        fontSize: "clamp(1rem, 2vw, 1.35rem)",
                        color: c.color,
                        wordBreak: "break-all",
                      }}
                    >
                      {c.value}
                    </Typography>
                    {c.subtext && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.25 }}
                      >
                        {c.subtext}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ color: c.color, opacity: 0.6, ml: 1, mt: 0.5, flexShrink: 0 }}>
                    {c.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Gráficos ─────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Finanzas del mes */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Finanzas — Este mes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <BarChart
              dataset={financeData}
              xAxis={[{ scaleType: "band", dataKey: "label" }]}
              series={[{ dataKey: "value", label: "Monto ($)" }]}
              colors={[(idx) => financeColors[idx] ?? theme.palette.primary.main]}
              height={240}
              margin={{ top: 10, bottom: 30, left: 70, right: 10 }}
              yAxis={[{ valueFormatter: (v) => `$${(v / 1000).toFixed(0)}k` }]}
              tooltip={{ trigger: "item" }}
              slotProps={{ legend: { hidden: true } }}
            />
            <Box
              sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1, justifyContent: "center" }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Ingresos
                </Typography>
                <Typography fontWeight={600} color="success.main">
                  {fmtARS(stats.income_this_month)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Egresos
                </Typography>
                <Typography fontWeight={600} color="error.main">
                  {fmtARS(stats.expense_this_month)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Balance
                </Typography>
                <Typography
                  fontWeight={600}
                  color={(stats.balance_this_month ?? 0) >= 0 ? "success.main" : "error.main"}
                >
                  {fmtARS(stats.balance_this_month)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Propiedades más solicitadas */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Propiedades más solicitadas (top 10)
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {ranking.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 200,
                }}
              >
                <Typography color="text.secondary">Aún no hay solicitudes de visita.</Typography>
              </Box>
            ) : (
              <BarChart
                dataset={ranking.map((r) => ({
                  label: r.listing_title
                    ? r.listing_title.length > 30
                      ? r.listing_title.slice(0, 28) + "…"
                      : r.listing_title
                    : `#${r.listing_id}`,
                  visits: r.visits_count,
                }))}
                layout="horizontal"
                yAxis={[{ scaleType: "band", dataKey: "label", tickLabelStyle: { fontSize: 11 } }]}
                xAxis={[{ tickMinStep: 1 }]}
                series={[{ dataKey: "visits", label: "Solicitudes" }]}
                colors={[theme.palette.primary.main]}
                height={Math.max(200, ranking.length * 36 + 60)}
                margin={{ top: 10, bottom: 30, left: 170, right: 20 }}
                slotProps={{ legend: { hidden: true } }}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Resumen de margen potencial ───────────────────────────── */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderColor: "#1565c040",
          background: "#e3f2fd",
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="#1565c0" gutterBottom>
          Resumen de margen potencial — Portfolio activo
        </Typography>
        <Divider sx={{ mb: 2, borderColor: "#1565c020" }} />
        <Grid container spacing={2}>
          {[
            { label: "Valor total", value: fmtARS(stats.portfolio_value), color: "#1565c0" },
            {
              label: "Com. comprador (3% base)",
              value: fmtARS(stats.commission_buyer_total),
              color: "#6a1b9a",
            },
            {
              label: "Com. vendedor (3% base)",
              value: fmtARS(stats.commission_seller_total),
              color: "#e65100",
            },
            {
              label: "Margen total estimado",
              value: fmtARS(stats.potential_margin),
              color: "#2e7d32",
              bold: true,
            },
          ].map((item) => (
            <Grid item xs={6} sm={3} key={item.label}>
              <Box sx={{ textAlign: "center", p: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {item.label}
                </Typography>
                <Typography
                  fontWeight={item.bold ? 800 : 600}
                  sx={{ color: item.color, fontSize: item.bold ? "1.1rem" : "1rem" }}
                >
                  {item.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* ── Chips + accesos rápidos ───────────────────────────────── */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 2 }}>
        <Chip
          icon={<TrendingUpIcon />}
          label={`${stats.sold_listings} vendidas/alquiladas · Conversión ${stats.conversion_rate}%`}
          color="primary"
          variant="outlined"
        />
        <Chip
          icon={<SavingsIcon />}
          label={`Comisiones cobradas: ${fmtARS(stats.sold_commission_earned)}`}
          color="success"
          variant="outlined"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button component={Link} to="/admin/visitas" variant="contained">
          Ver visitas
        </Button>
        <Button component={Link} to="/admin/anuncios" variant="outlined">
          Anuncios
        </Button>
        <Button component={Link} to="/admin/contabilidad" variant="outlined">
          Contabilidad
        </Button>
      </Box>
    </Box>
  );
}
