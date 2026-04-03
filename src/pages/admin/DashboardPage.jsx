import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Typography, Skeleton, Alert, useTheme } from "@mui/material";
import {
  Home,
  CalendarDays,
  Clock,
  CircleDollarSign,
  TrendingUp,
  Landmark,
  Wallet,
  Percent,
  BarChart3,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { getDashboardStats, getVisitsByListing } from "../../api/client";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminSurface } from "../../components/admin/AdminSurface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (n) => (n ?? 0).toLocaleString("es-AR");
const fmtARS = (n) => `$\u00a0${fmt(Math.round(n ?? 0))}`;

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-4 space-y-1">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
      <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function KpiTile({ label, value, icon: Icon, accentClass, iconStyle, warn }) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-foreground/5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-muted/50",
          accentClass,
        )}
        style={iconStyle}
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <p className="text-xs font-medium leading-snug text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-heading text-2xl font-semibold tabular-nums tracking-tight text-foreground",
          warn && "text-amber-700 dark:text-amber-500",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PortfolioTile({ label, value, subtext, icon: Icon, accent }) {
  return (
    <div className="flex flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug text-muted-foreground">{label}</p>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/40"
          style={{ color: accent }}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>
      </div>
      <p className="font-heading text-lg font-semibold tabular-nums leading-tight" style={{ color: accent }}>
        {value}
      </p>
      {subtext ? <p className="mt-1.5 text-[0.7rem] leading-snug text-muted-foreground">{subtext}</p> : null}
    </div>
  );
}

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
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton variant="rounded" width={200} height={28} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" width={320} height={20} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6">
          <Skeleton variant="rounded" className="md:col-span-2" height={340} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" className="md:col-span-3" height={340} sx={{ borderRadius: 3 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="rounded-xl border">
        {error}
      </Alert>
    );
  }
  if (!stats) return null;

  const operativeCards = [
    {
      label: "Propiedades activas",
      value: stats.active_listings,
      icon: Home,
      accentClass: "text-primary",
      iconStyle: { color: theme.palette.primary.main },
    },
    {
      label: "Visitas del mes",
      value: stats.visits_this_month,
      icon: CalendarDays,
      accentClass: "text-sky-700",
      iconStyle: { color: theme.palette.info.main },
    },
    {
      label: "Pendientes de confirmar",
      value: stats.pending_visits,
      icon: Clock,
      accentClass: "text-amber-700",
      iconStyle: { color: theme.palette.warning.main },
      warn: true,
    },
    {
      label: "Vendidas / alquiladas",
      value: stats.sold_listings,
      icon: CircleDollarSign,
      accentClass: "text-emerald-700",
      iconStyle: { color: theme.palette.success.main },
    },
    {
      label: "Tasa de conversión",
      value: `${stats.conversion_rate}%`,
      icon: TrendingUp,
      accentClass: "text-zinc-700",
      iconStyle: { color: theme.palette.secondary.main },
    },
  ];

  const portfolioCards = [
    {
      label: "Valor total del portfolio",
      value: fmtARS(stats.portfolio_value),
      subtext: `${stats.listings_with_price} propiedades con precio`,
      icon: Landmark,
      accent: theme.palette.primary.main,
    },
    {
      label: "Margen potencial total",
      value: fmtARS(stats.potential_margin),
      subtext: "Comisiones comprador + vendedor",
      icon: Wallet,
      accent: "#0369a1",
    },
    {
      label: "Com. comprador (potencial)",
      value: fmtARS(stats.commission_buyer_total),
      subtext: "Sobre propiedades activas",
      icon: Percent,
      accent: "#6d28d9",
    },
    {
      label: "Com. vendedor (potencial)",
      value: fmtARS(stats.commission_seller_total),
      subtext: "Sobre propiedades activas",
      icon: Percent,
      accent: "#b45309",
    },
    {
      label: "Precio promedio",
      value: fmtARS(stats.avg_listing_price),
      subtext: "Propiedades activas con precio",
      icon: BarChart3,
      accent: "#0f766e",
    },
    {
      label: "Comisiones ganadas (vendidas)",
      value: fmtARS(stats.sold_commission_earned),
      subtext: `Portfolio vendido: ${fmtARS(stats.sold_portfolio_value)}`,
      icon: BadgeCheck,
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
    <div className="flex flex-col gap-10 pb-4">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Indicadores clave, portfolio y finanzas del mes en una sola vista."
      />

      <section>
        <SectionTitle
          eyebrow="Operación"
          title="Actividad del mes"
          description="Seguimiento rápido de stock, visitas y conversión."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {operativeCards.map((c) => (
            <KpiTile key={c.label} {...c} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Portfolio"
          title="Números financieros"
          description="Valores sobre propiedades activas y comisiones estimadas."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioCards.map((c) => (
            <PortfolioTile key={c.label} {...c} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Análisis"
          title="Gráficos"
          description="Flujo de caja del mes y ranking de solicitudes de visita."
        />
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-5 md:gap-6">
          <AdminSurface className="h-full md:col-span-2" contentClassName="flex h-full min-h-0 flex-col gap-0 p-0">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
              <Typography variant="subtitle2" className="!font-semibold !tracking-tight">
                Finanzas — este mes
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Ingresos, egresos y balance registrados en contabilidad
              </Typography>
            </div>
            <div className="px-3 pb-2 pt-4 sm:px-5">
              <div className="rounded-lg bg-muted/30 p-2">
                <BarChart
                  dataset={financeData}
                  xAxis={[{ scaleType: "band", dataKey: "label" }]}
                  series={[{ dataKey: "value", label: "Monto ($)" }]}
                  colors={[(idx) => financeColors[idx] ?? theme.palette.primary.main]}
                  height={220}
                  margin={{ top: 8, bottom: 28, left: 56, right: 8 }}
                  yAxis={[{ valueFormatter: (v) => `$${(v / 1000).toFixed(0)}k` }]}
                  tooltip={{ trigger: "item" }}
                  slotProps={{ legend: { hidden: true } }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-4">
                <div className="text-center">
                  <Typography variant="caption" color="text.secondary" display="block">
                    Ingresos
                  </Typography>
                  <Typography fontWeight={700} color="success.main" variant="body2" sx={{ mt: 0.25 }}>
                    {fmtARS(stats.income_this_month)}
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography variant="caption" color="text.secondary" display="block">
                    Egresos
                  </Typography>
                  <Typography fontWeight={700} color="error.main" variant="body2" sx={{ mt: 0.25 }}>
                    {fmtARS(stats.expense_this_month)}
                  </Typography>
                </div>
                <div className="text-center">
                  <Typography variant="caption" color="text.secondary" display="block">
                    Balance
                  </Typography>
                  <Typography
                    fontWeight={700}
                    variant="body2"
                    sx={{
                      mt: 0.25,
                      color: (stats.balance_this_month ?? 0) >= 0 ? "success.main" : "error.main",
                    }}
                  >
                    {fmtARS(stats.balance_this_month)}
                  </Typography>
                </div>
              </div>
            </div>
          </AdminSurface>

          <AdminSurface className="h-full min-h-[280px] md:col-span-3" contentClassName="flex flex-col gap-0 p-0">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
              <Typography variant="subtitle2" className="!font-semibold !tracking-tight">
                Más solicitudes de visita
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Top 10 propiedades por cantidad de pedidos
              </Typography>
            </div>
            <div className="min-w-0 flex-1 px-2 py-4 sm:px-4">
              {ranking.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
                  <CalendarDays className="size-10 text-muted-foreground/50" strokeWidth={1.25} />
                  <p className="text-sm font-medium text-foreground">Sin datos aún</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Cuando haya solicitudes de visita, el ranking aparecerá aquí.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
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
                    height={Math.max(200, ranking.length * 34 + 56)}
                    margin={{ top: 8, bottom: 24, left: 160, right: 16 }}
                    slotProps={{ legend: { hidden: true } }}
                  />
                </div>
              )}
            </div>
          </AdminSurface>
        </div>
      </section>

      <AdminSurface
        className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-card"
        contentClassName="p-0"
      >
        <div className="border-b border-border/50 bg-muted/20 px-5 py-4">
          <Typography variant="subtitle2" className="!font-semibold !tracking-tight">
            Resumen de margen — portfolio activo
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Valor agregado y comisiones estimadas al 3% base
          </Typography>
        </div>
        <div className="grid grid-cols-2 gap-4 px-4 py-5 sm:grid-cols-4 sm:gap-6 sm:px-6">
          {[
            { label: "Valor total", value: fmtARS(stats.portfolio_value), color: "#0369a1" },
            { label: "Com. comprador (3%)", value: fmtARS(stats.commission_buyer_total), color: "#6d28d9" },
            { label: "Com. vendedor (3%)", value: fmtARS(stats.commission_seller_total), color: "#b45309" },
            { label: "Margen estimado", value: fmtARS(stats.potential_margin), color: "#15803d", bold: true },
          ].map((item) => (
            <div key={item.label} className="text-center sm:text-left">
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                {item.label}
              </Typography>
              <Typography
                fontWeight={item.bold ? 800 : 700}
                sx={{ color: item.color, fontSize: item.bold ? "1.0625rem" : "0.9375rem" }}
                className="tabular-nums"
              >
                {item.value}
              </Typography>
            </div>
          ))}
        </div>
      </AdminSurface>

      <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-muted/25 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-foreground">
            <TrendingUp className="size-3.5 text-primary" />
            {stats.sold_listings} vendidas · {stats.conversion_rate}% conv.
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-foreground">
            <BadgeCheck className="size-3.5 text-emerald-600" />
            Cobrado: {fmtARS(stats.sold_commission_earned)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/admin/visitas">
              Visitas
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/anuncios">Anuncios</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/contabilidad">Contabilidad</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
