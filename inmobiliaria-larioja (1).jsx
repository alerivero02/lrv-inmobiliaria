import { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Stack,
  Divider,
  IconButton,
  TextField,
  Tab,
  Tabs,
  Avatar,
  Paper,
  Badge,
} from "@mui/material";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// ── LOGO ──────────────────────────────────────────────────────────────
const LOGO_SRC =
  "data:image/webp;base64,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";

// ── THEME ─────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00FF00", dark: "#00CC00", light: "#66FF66", contrastText: "#000" },
    secondary: { main: "#0a0a0a", light: "#141414", dark: "#000000" },
    background: { default: "#050505", paper: "#0d0d0d" },
    text: { primary: "#f0fff0", secondary: "#88cc88" },
    success: { main: "#00FF00" },
  },
  typography: {
    fontFamily: "\'Syne\', sans-serif",
    h1: { fontFamily: "\'Syne\', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "\'Syne\', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "\'Syne\', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "\'Syne\', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "\'Syne\', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "\'Syne\', sans-serif", fontWeight: 600 },
    body1: { fontFamily: "\'DM Sans\', sans-serif" },
    body2: { fontFamily: "\'DM Sans\', sans-serif" },
    button: { fontFamily: "\'Syne\', sans-serif", fontWeight: 700, letterSpacing: "0.08em" },
  },
  shape: { borderRadius: 2 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.1em" },
        containedPrimary: {
          background: "#00FF00",
          color: "#000",
          "&:hover": { background: "#00CC00", boxShadow: "0 0 20px rgba(0,255,0,0.4)" },
        },
        outlinedPrimary: {
          border: "1px solid #00FF00",
          color: "#00FF00",
          "&:hover": { background: "rgba(0,255,0,0.06)", border: "1px solid #00FF00" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "#0d0d0d",
          border: "1px solid rgba(0,255,0,0.08)",
          borderRadius: 2,
          "&:hover": {
            border: "1px solid rgba(0,255,0,0.3)",
            boxShadow: "0 8px 40px rgba(0,255,0,0.1)",
          },
          transition: "all 0.35s ease",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: "\'Syne\', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.05em",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "rgba(0,255,0,0.2)" },
            "&:hover fieldset": { borderColor: "rgba(0,255,0,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#00FF00" },
            color: "#f0fff0",
          },
          "& .MuiInputLabel-root": { color: "#88cc88" },
          "& .MuiInputLabel-root.Mui-focused": { color: "#00FF00" },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: "\'Syne\', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#88cc88",
          "&.Mui-selected": { color: "#00FF00" },
        },
      },
    },
    MuiTabs: {
      styleOverrides: { indicator: { backgroundColor: "#00FF00", height: 2 } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: "rgba(0,255,0,0.12)" } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
  },
});

// ── DATA ───────────────────────────────────────────────────────────────
const PROPERTIES = [
  {
    id: 1,
    type: "Casa",
    title: "Casona en Valle del Famatina",
    price: "$85.000.000",
    location: "Chilecito",
    beds: 4,
    baths: 3,
    m2: 280,
    tag: "Destacada",
    color: "#003300",
  },
  {
    id: 2,
    type: "Terreno",
    title: "Lote en Zona Vinícola",
    price: "$22.000.000",
    location: "Nonogasta",
    beds: null,
    baths: null,
    m2: 1200,
    tag: "Oportunidad",
    color: "#001a00",
  },
  {
    id: 3,
    type: "Departamento",
    title: "Penthouse en Capital Riojana",
    price: "$54.000.000",
    location: "La Rioja Capital",
    beds: 3,
    baths: 2,
    m2: 145,
    tag: "Nuevo",
    color: "#002200",
  },
  {
    id: 4,
    type: "Finca",
    title: "Finca Productiva con Olivares",
    price: "$130.000.000",
    location: "Arauco",
    beds: 5,
    baths: 4,
    m2: 8500,
    tag: "Exclusiva",
    color: "#003a00",
  },
  {
    id: 5,
    type: "Casa",
    title: "Casa de Adobe Restaurada",
    price: "$47.000.000",
    location: "Aimogasta",
    beds: 3,
    baths: 2,
    m2: 190,
    tag: "Histórica",
    color: "#002b00",
  },
  {
    id: 6,
    type: "Campo",
    title: "Campo Ganadero en Los Llanos",
    price: "$95.000.000",
    location: "Chepes",
    beds: 2,
    baths: 1,
    m2: 50000,
    tag: "Campo",
    color: "#001500",
  },
];

const TAG_COLORS = {
  Destacada: "#00FF00",
  Oportunidad: "#aaff00",
  Nuevo: "#00ffaa",
  Exclusiva: "#00ffff",
  Histórica: "#66ff66",
  Campo: "#44ee00",
};

const FILTERS = ["Todas", "Casa", "Departamento", "Terreno", "Finca", "Campo"];

const STATS = [
  { val: 350, suf: "+", label: "Propiedades vendidas" },
  { val: 8, suf: "", label: "Años de experiencia" },
  { val: 98, suf: "%", label: "Clientes satisfechos" },
  { val: 12, suf: "", label: "Departamentos" },
];

const TESTIMONIALS = [
  {
    name: "Familia Martínez",
    loc: "Chilecito",
    text: "Encontramos la finca de nuestros sueños. El proceso fue transparente y profesional.",
    stars: 5,
  },
  {
    name: "Ing. Carlos Vera",
    loc: "La Rioja Capital",
    text: "Vendí mi propiedad en tiempo récord y al mejor precio del mercado.",
    stars: 5,
  },
  {
    name: "Ana Rodríguez",
    loc: "Aimogasta",
    text: "Conocimiento increíble de la zona. Nos ayudaron en cada paso de la compra.",
    stars: 5,
  },
];

// ── COUNTER ───────────────────────────────────────────────────────────
function Counter({ val, suf, label }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !done.current) {
          done.current = true;
          let cur = 0;
          const step = Math.ceil(val / 60);
          const id = setInterval(() => {
            cur += step;
            if (cur >= val) {
              setN(val);
              clearInterval(id);
            } else setN(cur);
          }, 30);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [val]);
  return (
    <Box ref={ref} sx={{ textAlign: "center" }}>
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: "2.5rem", md: "3.5rem" },
          fontWeight: 900,
          color: "primary.main",
          lineHeight: 1,
          textShadow: "0 0 30px rgba(0,255,0,0.4)",
        }}
      >
        {n}
        {suf}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontSize: "0.7rem",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// ── PROPERTY CARD ─────────────────────────────────────────────────────
function PropCard({ prop }) {
  const [hov, setHov] = useState(false);
  return (
    <Card
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transform: hov ? "translateY(-6px)" : "none",
        boxShadow: hov ? "0 20px 60px rgba(0,255,0,0.15)" : "none",
      }}
    >
      {/* Visual band */}
      <Box
        sx={{
          position: "relative",
          height: 200,
          overflow: "hidden",
          background: `linear-gradient(160deg, ${prop.color} 0%, #00${prop.color.slice(3, 5)}11 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Scan-lines effect */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,0,0.015) 3px, rgba(0,255,0,0.015) 4px)",
            pointerEvents: "none",
          }}
        />
        {/* Big m² */}
        <Typography
          sx={{
            fontSize: "clamp(2rem,4vw,3.5rem)",
            fontWeight: 900,
            color: "rgba(0,255,0,0.12)",
            letterSpacing: "-0.04em",
            userSelect: "none",
            fontFamily: "Syne, sans-serif",
          }}
        >
          {prop.m2.toLocaleString()} m²
        </Typography>
        {/* Tag */}
        <Chip
          label={prop.tag}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            background: TAG_COLORS[prop.tag] || "#00FF00",
            color: "#000",
            fontWeight: 800,
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
          }}
        />
        {/* Type */}
        <Chip
          label={prop.type}
          size="small"
          sx={{
            position: "absolute",
            bottom: 12,
            right: 12,
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(0,255,0,0.3)",
            color: "#00FF00",
            fontWeight: 700,
            fontSize: "0.65rem",
          }}
        />
      </Box>

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5, p: 2.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: "primary.main",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          📍 {prop.location}
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: "text.primary", fontWeight: 700, lineHeight: 1.25, fontSize: "1rem" }}
        >
          {prop.title}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
          {prop.beds && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              🛏 {prop.beds} hab.
            </Typography>
          )}
          {prop.baths && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              🚿 {prop.baths} baños
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            📐 {prop.m2.toLocaleString()} m²
          </Typography>
        </Stack>
        <Divider sx={{ my: 0.5 }} />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: "auto" }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              Precio
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "primary.main",
                fontWeight: 900,
                lineHeight: 1.1,
                fontSize: "1.3rem",
                textShadow: "0 0 12px rgba(0,255,0,0.3)",
              }}
            >
              {prop.price}
            </Typography>
          </Box>
          <Button variant="outlined" size="small" sx={{ minWidth: 80 }}>
            Ver más
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [filter, setFilter] = useState(0);
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const filtered = filter === 0 ? PROPERTIES : PROPERTIES.filter((p) => p.type === FILTERS[filter]);

  const submit = () => {
    if (form.nombre && form.email) {
      setSubmitted(true);
      setForm({ nombre: "", email: "", mensaje: "" });
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; }
        html { scroll-behavior:smooth; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#050505; }
        ::-webkit-scrollbar-thumb { background:#00FF00; border-radius:2px; }
        @keyframes glow { 0%,100%{text-shadow:0 0 20px rgba(0,255,0,0.5)} 50%{text-shadow:0 0 50px rgba(0,255,0,0.9),0 0 100px rgba(0,255,0,0.3)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>

      {/* ── NAVBAR ── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: scrolled ? "rgba(5,5,5,0.96)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,255,0,0.15)" : "none",
          transition: "all 0.4s ease",
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1280,
            width: "100%",
            mx: "auto",
            px: { xs: 2, md: 4 },
            justifyContent: "space-between",
          }}
        >
          <Box
            component="a"
            href="#inicio"
            sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
          >
            <Box
              component="img"
              src={LOGO_SRC}
              alt="LRV"
              sx={{
                height: 40,
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 0 8px rgba(0,255,0,0.4))",
              }}
            />
          </Box>
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            {["Inicio", "Propiedades", "Nosotros", "Contacto"].map((s) => (
              <Typography
                key={s}
                component="a"
                href={`#${s.toLowerCase()}`}
                sx={{
                  color: "text.secondary",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  fontFamily: "Syne, sans-serif",
                  transition: "color 0.2s",
                  "&:hover": { color: "primary.main", textShadow: "0 0 12px rgba(0,255,0,0.6)" },
                }}
              >
                {s}
              </Typography>
            ))}
            <Button variant="contained" size="small" href="#contacto">
              Tasación Gratis
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ── HERO ── */}
      <Box
        id="inicio"
        component="section"
        sx={{
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(160deg, #000000 0%, #020f02 40%, #041504 100%)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Grid overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            backgroundImage:
              "linear-gradient(rgba(0,255,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />
        {/* Radial glow */}
        <Box
          sx={{
            position: "absolute",
            top: "20%",
            right: "10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,255,0,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "-5%",
            left: "5%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,255,0,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="lg" sx={{ pt: 14, pb: 16, position: "relative", zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={3} sx={{ animation: "fadeUp 0.8s ease both" }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    border: "1px solid rgba(0,255,0,0.25)",
                    borderRadius: "2px",
                    px: 2,
                    py: 0.8,
                    width: "fit-content",
                    background: "rgba(0,255,0,0.04)",
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#00FF00",
                      boxShadow: "0 0 8px #00FF00",
                      animation: "glow 2s ease infinite",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "primary.main", letterSpacing: "0.2em", fontWeight: 700 }}
                  >
                    LA RIOJA · ARGENTINA
                  </Typography>
                </Box>

                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "2.8rem", md: "4.5rem", lg: "5.5rem" },
                    lineHeight: 0.95,
                    color: "text.primary",
                    letterSpacing: "-0.02em",
                  }}
                >
                  TU PRÓXIMA
                  <br />
                  <Box
                    component="span"
                    sx={{
                      color: "primary.main",
                      animation: "glow 3s ease infinite",
                      display: "inline-block",
                    }}
                  >
                    PROPIEDAD
                  </Box>
                  <br />
                  RIOJANA.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    maxWidth: 480,
                    lineHeight: 1.8,
                    fontSize: "1.05rem",
                    fontWeight: 300,
                  }}
                >
                  Desde 2017 conectando familias con tierras, viñedos y hogares en el corazón de La
                  Rioja.
                </Typography>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    size="large"
                    href="#propiedades"
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: "0.85rem",
                      boxShadow: "0 0 24px rgba(0,255,0,0.35)",
                    }}
                  >
                    Ver Propiedades
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    href="#contacto"
                    sx={{ px: 4, py: 1.5, fontSize: "0.85rem" }}
                  >
                    Tasación Gratis
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid
              item
              xs={12}
              md={5}
              sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}
            >
              {/* Terminal-style card */}
              <Paper
                sx={{
                  p: 3,
                  border: "1px solid rgba(0,255,0,0.2)",
                  width: "100%",
                  maxWidth: 380,
                  background: "rgba(0,255,0,0.03)",
                  backdropFilter: "blur(10px)",
                  fontFamily: "monospace",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                    <Box
                      key={c}
                      sx={{ width: 12, height: 12, borderRadius: "50%", background: c }}
                    />
                  ))}
                  <Typography
                    sx={{
                      ml: 2,
                      fontSize: "0.7rem",
                      color: "rgba(0,255,0,0.4)",
                      fontFamily: "monospace",
                    }}
                  >
                    lrv_inmobiliaria.sh
                  </Typography>
                </Stack>
                {[
                  { t: "> scanning La Rioja...", c: "#00FF00" },
                  { t: "✓ 350+ propiedades encontradas", c: "#66ff66" },
                  { t: "✓ Chilecito, Arauco, Capital...", c: "#66ff66" },
                  { t: "✓ Fincas, casas, terrenos", c: "#66ff66" },
                  { t: "", c: "#00FF00" },
                  { t: "> Conectando con agente LRV...", c: "#00FF00" },
                  { t: "✓ Agente disponible ahora ●", c: "#00FF00" },
                ].map((l, i) => (
                  <Typography
                    key={i}
                    sx={{
                      fontSize: "0.78rem",
                      fontFamily: "monospace",
                      color: l.t === "" ? "transparent" : l.c,
                      mb: 0.5,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {l.t || "—"}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* Bottom wave */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            background: "linear-gradient(to bottom, transparent, #050505)",
          }}
        />
      </Box>

      {/* ── STATS ── */}
      <Box
        sx={{
          py: 7,
          background: "#080808",
          borderTop: "1px solid rgba(0,255,0,0.1)",
          borderBottom: "1px solid rgba(0,255,0,0.1)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {STATS.map((s) => (
              <Grid item xs={6} md={3} key={s.label}>
                <Counter {...s} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── PROPERTIES ── */}
      <Box id="propiedades" component="section" sx={{ py: 12, background: "#050505" }}>
        <Container maxWidth="lg">
          <Stack spacing={1} sx={{ mb: 6 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 28, height: 2, background: "#00FF00" }} />
              <Typography
                variant="caption"
                sx={{
                  color: "primary.main",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Nuestras Propiedades
              </Typography>
            </Stack>
            <Typography
              variant="h2"
              sx={{ color: "text.primary", fontSize: { xs: "2.2rem", md: "3.2rem" } }}
            >
              ENCONTRÁ TU LUGAR
              <br />
              <Box component="span" sx={{ color: "primary.main" }}>
                EN LA RIOJA
              </Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "text.secondary", maxWidth: 480, lineHeight: 1.8, fontWeight: 300 }}
            >
              Desde fincas históricas hasta modernos departamentos — todo el territorio riojano.
            </Typography>
          </Stack>

          <Tabs
            value={filter}
            onChange={(_, v) => setFilter(v)}
            sx={{ mb: 5, borderBottom: "1px solid rgba(0,255,0,0.12)" }}
          >
            {FILTERS.map((f, i) => (
              <Tab key={f} label={f} value={i} />
            ))}
          </Tabs>

          <Grid container spacing={3}>
            {filtered.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <PropCard prop={p} />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: "center", mt: 7 }}>
            <Button variant="outlined" size="large" sx={{ px: 6, py: 1.5 }}>
              Ver todas las propiedades
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── NOSOTROS ── */}
      <Box
        id="nosotros"
        component="section"
        sx={{
          py: 12,
          background: "linear-gradient(160deg, #020f02 0%, #000 100%)",
          borderTop: "1px solid rgba(0,255,0,0.1)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ width: 28, height: 2, background: "#00FF00" }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "primary.main",
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    ¿Por qué elegirnos?
                  </Typography>
                </Stack>
                <Typography
                  variant="h2"
                  sx={{ color: "text.primary", fontSize: { xs: "2rem", md: "2.8rem" } }}
                >
                  RAÍCES EN
                  <br />
                  <Box component="span" sx={{ color: "primary.main" }}>
                    TIERRA RIOJANA
                  </Box>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", lineHeight: 1.8, fontWeight: 300 }}
                >
                  Desde 2017 nuestro equipo recorre cada vallecito, zona vinícola y oportunidad de
                  inversión de la provincia.
                </Typography>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                  {[
                    [
                      "🌿",
                      "Conocimiento local profundo",
                      "Desde 2017 recorriendo la provincia en detalle",
                    ],
                    [
                      "⚖️",
                      "Asesoramiento legal completo",
                      "Acompañamos cada paso del proceso escritural",
                    ],
                    [
                      "📊",
                      "Valuaciones precisas",
                      "Tasaciones basadas en datos reales del mercado riojano",
                    ],
                  ].map(([icon, title, desc]) => (
                    <Stack key={title} direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          minWidth: 44,
                          border: "1px solid rgba(0,255,0,0.25)",
                          borderRadius: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                          background: "rgba(0,255,0,0.04)",
                        }}
                      >
                        {icon}
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: "text.primary", fontWeight: 700, mb: 0.3 }}
                        >
                          {title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", lineHeight: 1.6 }}
                        >
                          {desc}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2.5}>
                {TESTIMONIALS.map((t, i) => (
                  <Paper
                    key={i}
                    sx={{
                      p: 3,
                      border: "1px solid rgba(0,255,0,0.1)",
                      background: "rgba(0,255,0,0.03)",
                      transform: i === 1 ? "translateX(24px)" : "none",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        border: "1px solid rgba(0,255,0,0.3)",
                        transform:
                          i === 1 ? "translateX(24px) translateY(-4px)" : "translateY(-4px)",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        color: "primary.main",
                        fontSize: "0.9rem",
                        letterSpacing: "0.1em",
                        mb: 1.5,
                      }}
                    >
                      {"★".repeat(t.stars)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", lineHeight: 1.7, fontStyle: "italic", mb: 2 }}
                    >
                      "{t.text}"
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          background: "rgba(0,255,0,0.15)",
                          border: "1px solid rgba(0,255,0,0.3)",
                          color: "primary.main",
                          fontSize: "0.85rem",
                          fontWeight: 800,
                        }}
                      >
                        {t.name[0]}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.primary", fontWeight: 700, display: "block" }}
                        >
                          {t.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontSize: "0.68rem" }}
                        >
                          📍 {t.loc}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── CONTACTO ── */}
      <Box
        id="contacto"
        component="section"
        sx={{ py: 12, background: "#080808", borderTop: "1px solid rgba(0,255,0,0.1)" }}
      >
        <Container maxWidth="md">
          <Stack spacing={1} alignItems="center" sx={{ mb: 7, textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                color: "primary.main",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Contacto
            </Typography>
            <Typography
              variant="h2"
              sx={{ color: "text.primary", fontSize: { xs: "2rem", md: "3rem" } }}
            >
              ¿LISTO PARA DAR
              <br />
              <Box component="span" sx={{ color: "primary.main" }}>
                EL PRIMER PASO?
              </Box>
            </Typography>
          </Stack>

          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Nombre completo"
                  variant="outlined"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  variant="outlined"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Mensaje"
                  multiline
                  rows={5}
                  variant="outlined"
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  placeholder="Estoy buscando una propiedad en..."
                />
                <Button
                  variant="contained"
                  size="large"
                  onClick={submit}
                  sx={{
                    py: 1.8,
                    fontSize: "0.9rem",
                    background: submitted ? "rgba(0,255,0,0.7)" : "#00FF00",
                    boxShadow: submitted
                      ? "0 0 30px rgba(0,255,0,0.5)"
                      : "0 0 20px rgba(0,255,0,0.3)",
                  }}
                >
                  {submitted ? "✓ Mensaje enviado" : "Enviar consulta"}
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                {[
                  [
                    "📍",
                    "Oficina Central",
                    "Av. Rivadavia 345, piso 2",
                    "La Rioja Capital, CP 5300",
                  ],
                  ["📞", "Teléfonos", "+54 380 4-123456", "+54 380 4-654321"],
                  ["📧", "Email", "info@lrvinmobiliaria.com.ar", "ventas@lrvinmobiliaria.com.ar"],
                  ["🕐", "Horarios", "Lun–Vie: 9:00 – 18:00 hs", "Sáb: 9:00 – 13:00 hs"],
                ].map(([icon, title, l1, l2]) => (
                  <Stack key={title} direction="row" spacing={2}>
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        minWidth: 46,
                        border: "1px solid rgba(0,255,0,0.2)",
                        borderRadius: "2px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        background: "rgba(0,255,0,0.04)",
                      }}
                    >
                      {icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "primary.main",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          display: "block",
                          mb: 0.3,
                        }}
                      >
                        {title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                        {l1}
                        <br />
                        {l2}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                  {["Instagram", "Facebook", "WhatsApp"].map((s) => (
                    <Button
                      key={s}
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: "0.7rem", px: 2, letterSpacing: "0.08em" }}
                    >
                      {s}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── FOOTER ── */}
      <Box
        component="footer"
        sx={{ py: 5, background: "#000", borderTop: "1px solid rgba(0,255,0,0.15)" }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ pb: 3, mb: 3, borderBottom: "1px solid rgba(0,255,0,0.08)" }}
          >
            <Box
              component="img"
              src={LOGO_SRC}
              alt="LRV"
              sx={{
                height: 36,
                objectFit: "contain",
                filter: "drop-shadow(0 0 6px rgba(0,255,0,0.3))",
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "rgba(0,255,0,0.25)", letterSpacing: "0.05em" }}
            >
              Matrícula CUIT: 30-71234567-9 · Reg. Inmobiliario Nº 1289
            </Typography>
          </Stack>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography
              variant="caption"
              sx={{ color: "rgba(0,255,0,0.2)", letterSpacing: "0.05em" }}
            >
              © 2017–2026 LRV Inmobiliaria La Rioja. Todos los derechos reservados.
            </Typography>
            <Stack direction="row" spacing={3}>
              {["Términos", "Privacidad", "Cookies"].map((s) => (
                <Typography
                  key={s}
                  component="a"
                  href="#"
                  sx={{
                    fontSize: "0.7rem",
                    color: "rgba(0,255,0,0.2)",
                    textDecoration: "none",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    "&:hover": { color: "primary.main" },
                    transition: "color 0.2s",
                  }}
                >
                  {s}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
