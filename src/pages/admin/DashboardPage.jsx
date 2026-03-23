import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
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
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";

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
        <Skeleton variant="text" width={280} height={44} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={400} height={24} sx={{ mb: 3 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={108} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
          <Skeleton variant="rounded" height={320} />
          <Skeleton variant="rounded" height={320} />
        </Box>
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

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

  const portfolioCards = [
    {
      label: "Valor total del portfolio",
      value: fmtARS(stats.portfolio_value),
      subtext: `${stats.listings_with_price} prop. con precio`,
      icon: <AccountBalanceIcon />,
      accent: theme.palette.primary.main,
    },
    {
      label: "Margen potencial total",
      value: fmtARS(stats.potential_margin),
      subtext: "Comisiones comprador + vendedor",
      icon: <SavingsIcon />,
      accent: "#0369a1",
    },
    {
      label: "Com. comprador (potencial)",
      value: fmtARS(stats.commission_buyer_total),
      subtext: "Sobre propiedades activas",
      icon: <PercentIcon />,
      accent: "#6d28d9",
    },
    {
      label: "Com. vendedor (potencial)",
      value: fmtARS(stats.commission_seller_total),
      subtext: "Sobre propiedades activas",
      icon: <PercentIcon />,
      accent: "#b45309",
    },
    {
      label: "Precio promedio",
      value: fmtARS(stats.avg_listing_price),
      subtext: "Propiedades activas con precio",
      icon: <BarChartIcon />,
      accent: "#0f766e",
    },
    {
      label: "Comisiones ganadas (vendidas)",
      value: fmtARS(stats.sold_commission_earned),
      subtext: `Portfolio vendido: ${fmtARS(stats.sold_portfolio_value)}`,
      icon: <PriceCheckIcon />,
      accent: "#b91c1c",
    },
  ];

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
      <AdminPageHeader
        title="Dashboard"
        subtitle="Resumen operativo, números del portfolio y finanzas del mes en un solo vistazo."
      />

      <Typography variant="overline" sx={{ mb: 1.5, display: "block" }}>
        Actividad operativa
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 4,
        }}
      >
        {operativeCards.map((c) => (
          <Card
            key={c.label}
            variant="outlined"
            sx={{
              height: "100%",
              borderLeft: `4px solid ${c.color}`,
              transition: "box-shadow 0.2s, transform 0.2s",
              "&:hover": {
                boxShadow: "0 8px 28px rgba(28,25,23,0.08)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent sx={{ pb: "14px !important", pt: 2, px: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.35, mb: 0.75 }}>
                    {c.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: theme.typography.fontFamily,
                      fontWeight: 700,
                      fontSize: "1.5rem",
                      color: c.warn ? "warning.main" : "text.primary",
                    }}
                  >
                    {c.value}
                  </Typography>
                </Box>
                <Box sx={{ color: c.color, opacity: 0.85, mt: 0.25, flexShrink: 0 }}>{c.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Typography variant="overline" sx={{ mb: 1.5, display: "block" }}>
        Prospecto financiero del portfolio
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
          mb: 4,
        }}
      >
        {portfolioCards.map((c) => (
          <Card
            key={c.label}
            variant="outlined"
            sx={{
              height: "100%",
              borderLeft: `4px solid ${c.accent}`,
              bgcolor: "grey.50",
              transition: "box-shadow 0.2s",
              "&:hover": { boxShadow: "0 6px 24px rgba(28,25,23,0.07)" },
            }}
          >
            <CardContent sx={{ pb: "14px !important", pt: 2, px: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.35, mb: 0.75 }}>
                    {c.label}
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      fontSize: "clamp(0.95rem, 1.5vw, 1.2rem)",
                      color: c.accent,
                      wordBreak: "break-word",
                    }}
                  >
                    {c.value}
                  </Typography>
                  {c.subtext && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {c.subtext}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ color: c.accent, opacity: 0.55, ml: 0.5, flexShrink: 0 }}>{c.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
          gap: 3,
          mb: 4,
          alignItems: "stretch",
        }}
      >
        <Paper sx={{ p: 2.5, height: "100%" }}>
          <Typography variant="subtitle1" gutterBottom>
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
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1.5, justifyContent: "center" }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Ingresos
              </Typography>
              <Typography fontWeight={700} color="success.main" display="block">
                {fmtARS(stats.income_this_month)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Egresos
              </Typography>
              <Typography fontWeight={700} color="error.main" display="block">
                {fmtARS(stats.expense_this_month)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Balance
              </Typography>
              <Typography
                fontWeight={700}
                color={(stats.balance_this_month ?? 0) >= 0 ? "success.main" : "error.main"}
                display="block"
              >
                {fmtARS(stats.balance_this_month)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 2.5, height: "100%", minHeight: 280 }}>
          <Typography variant="subtitle1" gutterBottom>
            Propiedades más solicitadas (top 10)
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {ranking.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 220,
              }}
            >
              <Typography color="text.secondary">Aún no hay solicitudes de visita.</Typography>
            </Box>
          ) : (
            <BarChart
              dataset={ranking.map((r) => ({
                label: r.listing_title
                  ? r.listing_title.length > 30
                    ? `${r.listing_title.slice(0, 28)}…`
                    : r.listing_title
                  : `#${r.listing_id}`,
                visits: r.visits_count,
              }))}
              layout="horizontal"
              yAxis={[{ scaleType: "band", dataKey: "label", tickLabelStyle: { fontSize: 11 } }]}
              xAxis={[{ tickMinStep: 1 }]}
              series={[{ dataKey: "visits", label: "Solicitudes" }]}
              colors={[theme.palette.primary.main]}
              height={Math.max(220, ranking.length * 36 + 60)}
              margin={{ top: 10, bottom: 30, left: 170, right: 20 }}
              slotProps={{ legend: { hidden: true } }}
            />
          )}
        </Paper>
      </Box>

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: "rgba(3, 105, 161, 0.06)",
          borderColor: "rgba(3, 105, 161, 0.2)",
        }}
      >
        <Typography variant="subtitle1" sx={{ color: "#0369a1", fontWeight: 700 }} gutterBottom>
          Resumen de margen potencial — Portfolio activo
        </Typography>
        <Divider sx={{ mb: 2, borderColor: "rgba(3, 105, 161, 0.12)" }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {[
            { label: "Valor total", value: fmtARS(stats.portfolio_value), color: "#0369a1" },
            { label: "Com. comprador (3% base)", value: fmtARS(stats.commission_buyer_total), color: "#6d28d9" },
            { label: "Com. vendedor (3% base)", value: fmtARS(stats.commission_seller_total), color: "#b45309" },
            { label: "Margen total estimado", value: fmtARS(stats.potential_margin), color: "#15803d", bold: true },
          ].map((item) => (
            <Box key={item.label} sx={{ textAlign: "center", p: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {item.label}
              </Typography>
              <Typography
                fontWeight={item.bold ? 800 : 700}
                sx={{ color: item.color, fontSize: item.bold ? "1.05rem" : "0.95rem" }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2 }}>
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
        <Button component={Link} to="/admin/visitas" variant="contained" size="medium">
          Ver visitas
        </Button>
        <Button component={Link} to="/admin/anuncios" variant="outlined" size="medium">
          Anuncios
        </Button>
        <Button component={Link} to="/admin/contabilidad" variant="outlined" size="medium">
          Contabilidad
        </Button>
      </Box>
    </Box>
  );
}
