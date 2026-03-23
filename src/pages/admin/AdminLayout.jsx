import { useState, useEffect, useMemo } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Button,
  Divider,
  ThemeProvider,
  useTheme,
  useMediaQuery,
  IconButton,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PublicIcon from "@mui/icons-material/Public";
import PeopleIcon from "@mui/icons-material/People";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import {
  logout,
  getNotificationCounts,
  getStoredAdminProfile,
  refreshAdminProfile,
  isAuthenticated,
  changePassword,
} from "../../api/client";
import { adminTheme } from "../../theme/adminTheme";
import AdminMain from "../../components/admin/AdminMain";

const DRAWER_WIDTH = 272;

const navItems = [
  { to: "/admin", end: true, label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/admin/anuncios", end: false, label: "Anuncios", icon: <ArticleIcon /> },
  { to: "/admin/nuevo", end: false, label: "Nuevo anuncio", icon: <AddCircleOutlineIcon /> },
  { to: "/admin/visitas", end: false, label: "Visitas", icon: <CalendarMonthIcon /> },
  { to: "/admin/contabilidad", end: false, label: "Contabilidad", icon: <AccountBalanceIcon /> },
];

const usersNavItem = {
  to: "/admin/usuarios",
  end: false,
  label: "Usuarios",
  icon: <PeopleIcon />,
};

function DrawerContent({ onNavClick, profile }) {
  const theme = useTheme();
  const a = theme.palette.admin;
  const sidebarNav = useMemo(() => {
    if (profile?.role === "admin") {
      const next = [...navItems];
      next.splice(4, 0, usersNavItem);
      return next;
    }
    return navItems;
  }, [profile]);
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ pending_visits: 0, pending_listings: 0 });
  const [pwdOpen, setPwdOpen] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdSnack, setPwdSnack] = useState("");

  useEffect(() => {
    getNotificationCounts()
      .then(setCounts)
      .catch(() => {});
    const t = setInterval(
      () =>
        getNotificationCounts()
          .then(setCounts)
          .catch(() => {}),
      60000,
    );
    return () => clearInterval(t);
  }, []);

  const linkProps = onNavClick ? { onClick: onNavClick } : {};

  const handlePwdClose = () => {
    if (pwdBusy) return;
    setPwdOpen(false);
    setPwdErr("");
    setCurPw("");
    setNewPw("");
    setNewPw2("");
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdErr("");
    if (newPw !== newPw2) {
      setPwdErr("Las contraseñas nuevas no coinciden.");
      return;
    }
    setPwdBusy(true);
    try {
      await changePassword(curPw, newPw);
      setPwdSnack("Contraseña actualizada");
      handlePwdClose();
    } catch (err) {
      setPwdErr(err.message || "Error");
    } finally {
      setPwdBusy(false);
    }
  };

  const navIconSx = { minWidth: 42, color: "inherit" };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: a.sidebar,
        color: a.sidebarText,
        borderRight: `1px solid ${a.sidebarBorder}`,
      }}
    >
      <Box sx={{ px: 2.25, pt: 2.5, pb: 2, borderBottom: `1px solid ${a.sidebarBorder}` }}>
        <Link to="/admin" style={{ textDecoration: "none" }} {...linkProps}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: theme.typography.h5.fontFamily,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            LRV
          </Typography>
          <Typography variant="caption" sx={{ display: "block", color: a.sidebarTextMuted, mt: 0.25 }}>
            Panel de gestión
          </Typography>
        </Link>
      </Box>

      <Box sx={{ px: 1.5, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          variant="overline"
          sx={{ px: 1, color: a.sidebarTextMuted, fontSize: "0.65rem", letterSpacing: "0.14em" }}
        >
          Atajos
        </Typography>
        <ListItemButton
          component={Link}
          to="/admin/visitas"
          sx={{
            borderRadius: 2,
            py: 1.25,
            bgcolor: a.sidebarElevated,
            border: `1px solid ${a.sidebarBorder}`,
            "&:hover": { bgcolor: a.sidebarHover },
          }}
          {...linkProps}
        >
          <ListItemIcon sx={navIconSx}>
            <Badge badgeContent={counts.pending_visits} color="warning">
              <NotificationsActiveIcon sx={{ color: a.accent }} fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary="Visitas"
            secondary={counts.pending_visits > 0 ? `${counts.pending_visits} pendientes` : "Calendario y lista"}
            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}
            secondaryTypographyProps={{ fontSize: "0.75rem", color: a.sidebarTextMuted }}
          />
        </ListItemButton>
        <ListItemButton
          component={Link}
          to="/admin/anuncios?status=pending_review"
          sx={{
            borderRadius: 2,
            py: 1.25,
            bgcolor: a.sidebarElevated,
            border: `1px solid ${a.sidebarBorder}`,
            "&:hover": { bgcolor: a.sidebarHover },
          }}
          {...linkProps}
        >
          <ListItemIcon sx={navIconSx}>
            <Badge badgeContent={counts.pending_listings} color="warning">
              <AssignmentIcon sx={{ color: a.accent }} fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary="Publicaciones"
            secondary={
              counts.pending_listings > 0 ? `${counts.pending_listings} en revisión` : "Revisar anuncios"
            }
            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}
            secondaryTypographyProps={{ fontSize: "0.75rem", color: a.sidebarTextMuted }}
          />
        </ListItemButton>
      </Box>

      <Divider sx={{ borderColor: a.sidebarBorder, mx: 1.5 }} />

      <Typography
        variant="overline"
        sx={{ px: 2.25, pt: 2, pb: 0.5, color: a.sidebarTextMuted, fontSize: "0.65rem", letterSpacing: "0.14em" }}
      >
        Menú
      </Typography>
      <List dense sx={{ px: 1, flex: 1, py: 0 }}>
        {sidebarNav.map(({ to, end, label, icon }) => (
          <NavLink key={to} to={to} end={end} style={{ textDecoration: "none", color: "inherit" }}>
            {({ isActive }) => (
              <ListItemButton
                selected={isActive}
                onClick={onNavClick}
                sx={{
                  borderRadius: 2,
                  mb: 0.35,
                  py: 1,
                  borderLeft: isActive ? `3px solid ${a.accent}` : "3px solid transparent",
                  pl: isActive ? 1.5 : 1.75,
                  bgcolor: isActive ? a.sidebarActive : "transparent",
                  color: isActive ? "#fff" : a.sidebarText,
                  "&:hover": { bgcolor: isActive ? a.sidebarActive : a.sidebarHover },
                  "&.Mui-selected": { bgcolor: a.sidebarActive, "&:hover": { bgcolor: a.sidebarActive } },
                }}
              >
                <ListItemIcon
                  sx={{
                    ...navIconSx,
                    color: isActive ? a.accent : a.sidebarText,
                  }}
                >
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            )}
          </NavLink>
        ))}
      </List>

      {profile?.email && (
        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${a.sidebarBorder}` }}>
          <Typography variant="caption" sx={{ color: a.sidebarTextMuted, display: "block" }}>
            Sesión
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#fff", fontWeight: 500, fontSize: "0.8125rem", wordBreak: "break-all" }}
          >
            {profile.email}
          </Typography>
        </Box>
      )}

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0.75, borderTop: `1px solid ${a.sidebarBorder}` }}>
        <Button
          component={Link}
          to="/"
          startIcon={<PublicIcon sx={{ fontSize: 18 }} />}
          size="small"
          sx={{
            justifyContent: "flex-start",
            color: a.sidebarText,
            borderRadius: 2,
            py: 0.75,
            "&:hover": { bgcolor: a.sidebarHover, color: "#fff" },
          }}
          onClick={onNavClick}
        >
          Ver sitio público
        </Button>
        <Button
          startIcon={<VpnKeyIcon sx={{ fontSize: 18 }} />}
          onClick={() => setPwdOpen(true)}
          size="small"
          sx={{
            justifyContent: "flex-start",
            color: a.sidebarText,
            borderRadius: 2,
            py: 0.75,
            "&:hover": { bgcolor: a.sidebarHover, color: "#fff" },
          }}
        >
          Cambiar contraseña
        </Button>
        <Button
          startIcon={<LogoutIcon sx={{ fontSize: 18 }} />}
          onClick={() => {
            logout();
            navigate("/admin/login");
          }}
          size="small"
          sx={{
            justifyContent: "flex-start",
            color: a.sidebarTextMuted,
            borderRadius: 2,
            py: 0.75,
            "&:hover": { bgcolor: "rgba(185,28,28,0.15)", color: "#fecaca" },
          }}
        >
          Cerrar sesión
        </Button>
      </Box>

      <Dialog
        open={pwdOpen}
        onClose={handlePwdClose}
        fullWidth
        maxWidth="xs"
        component="form"
        onSubmit={handlePwdSubmit}
      >
        <DialogTitle sx={{ fontFamily: adminTheme.typography.h5.fontFamily }}>Cambiar contraseña</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {pwdErr && (
            <Alert severity="error" onClose={() => setPwdErr("")}>
              {pwdErr}
            </Alert>
          )}
          <TextField
            label="Contraseña actual"
            type="password"
            value={curPw}
            onChange={(e) => setCurPw(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            disabled={pwdBusy}
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            disabled={pwdBusy}
            helperText="12+ caracteres, mayúsculas, minúsculas, número y símbolo"
          />
          <TextField
            label="Repetir nueva contraseña"
            type="password"
            value={newPw2}
            onChange={(e) => setNewPw2(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            disabled={pwdBusy}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handlePwdClose} disabled={pwdBusy}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={pwdBusy}>
            {pwdBusy ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(pwdSnack)}
        autoHideDuration={5000}
        onClose={() => setPwdSnack("")}
        message={pwdSnack}
      />
    </Box>
  );
}

export default function AdminLayout() {
  const isMobile = useMediaQuery(adminTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState(() => getStoredAdminProfile());
  const a = adminTheme.palette.admin;

  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated()) {
      refreshAdminProfile().then((p) => {
        if (!cancelled && p) setProfile(p);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const drawer = (
    <DrawerContent
      profile={profile}
      onNavClick={isMobile ? () => setMobileOpen(false) : undefined}
    />
  );

  return (
    <ThemeProvider theme={adminTheme}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        {isMobile && (
          <AppBar
            position="fixed"
            sx={{
              zIndex: (theme) => theme.zIndex.drawer + 1,
              bgcolor: a.sidebar,
              color: "#fff",
              boxShadow: `0 1px 0 ${a.sidebarBorder}`,
            }}
          >
            <Toolbar sx={{ minHeight: 56 }}>
              <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
              <Link to="/admin" style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                <Typography sx={{ fontFamily: adminTheme.typography.h5.fontFamily, fontWeight: 700 }}>
                  LRV Admin
                </Typography>
              </Link>
            </Toolbar>
          </AppBar>
        )}

        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: isMobile ? "auto" : DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              borderRight: "none",
              bgcolor: a.sidebar,
              ...(isMobile && { top: 56 }),
              ...(isMobile && { height: "calc(100% - 56px)" }),
            },
          }}
        >
          {drawer}
        </Drawer>

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            pt: { xs: 8, md: 0 },
            pb: { xs: 3, md: 4 },
            px: { xs: 2, sm: 2.5, md: 3.5 },
            overflow: "auto",
          }}
        >
          <AdminMain>
            <Outlet />
          </AdminMain>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
