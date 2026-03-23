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

const DRAWER_WIDTH = 260;

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

  return (
    <>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Link to="/admin" style={{ textDecoration: "none" }} {...linkProps}>
          <Typography variant="h6" component="span" color="primary" fontWeight={700}>
            LRV Admin
          </Typography>
        </Link>
      </Box>

      <Box sx={{ px: 1, py: 1 }}>
        <ListItemButton
          component={Link}
          to="/admin/visitas"
          sx={{ borderRadius: 2 }}
          {...linkProps}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Badge badgeContent={counts.pending_visits} color="warning">
              <NotificationsActiveIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary="Visitas"
            secondary={counts.pending_visits > 0 ? `${counts.pending_visits} pendientes` : null}
            primaryTypographyProps={{ fontSize: "0.875rem" }}
          />
        </ListItemButton>
        <ListItemButton
          component={Link}
          to="/admin/anuncios?status=pending_review"
          sx={{ borderRadius: 2 }}
          {...linkProps}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Badge badgeContent={counts.pending_listings} color="warning">
              <AssignmentIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary="Publicaciones"
            secondary={counts.pending_listings > 0 ? `${counts.pending_listings} pendientes` : null}
            primaryTypographyProps={{ fontSize: "0.875rem" }}
          />
        </ListItemButton>
      </Box>

      <Divider sx={{ my: 1 }} />

      <List dense sx={{ px: 1 }}>
        {sidebarNav.map(({ to, end, label, icon }) => (
          <NavLink key={to} to={to} end={end} style={{ textDecoration: "none", color: "inherit" }}>
            {({ isActive }) => (
              <ListItemButton
                selected={isActive}
                sx={{ borderRadius: 2, mb: 0.5 }}
                onClick={onNavClick}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? "primary.main" : "inherit" }}>
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: "0.9375rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            )}
          </NavLink>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        <Button
          component={Link}
          to="/"
          startIcon={<PublicIcon />}
          size="small"
          color="inherit"
          sx={{ justifyContent: "flex-start" }}
          onClick={onNavClick}
        >
          Ver landing
        </Button>
        <Button
          startIcon={<VpnKeyIcon />}
          onClick={() => setPwdOpen(true)}
          size="small"
          color="inherit"
          sx={{ justifyContent: "flex-start" }}
        >
          Cambiar contraseña
        </Button>
        <Button
          startIcon={<LogoutIcon />}
          onClick={() => {
            logout();
            navigate("/admin/login");
          }}
          size="small"
          color="inherit"
          sx={{ justifyContent: "flex-start" }}
        >
          Cerrar sesión
        </Button>
      </Box>

      <Dialog open={pwdOpen} onClose={handlePwdClose} fullWidth maxWidth="xs" component="form" onSubmit={handlePwdSubmit}>
        <DialogTitle>Cambiar contraseña</DialogTitle>
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
    </>
  );
}

export default function AdminLayout() {
  const isMobile = useMediaQuery(adminTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState(() => getStoredAdminProfile());

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
              bgcolor: "background.paper",
              color: "text.primary",
              boxShadow: 1,
            }}
          >
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
              <Link to="/admin" style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                <Typography variant="h6" color="primary" fontWeight={700}>
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
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
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
            p: { xs: 2, sm: 3 },
            pt: { xs: 8, sm: 3 },
            overflow: "auto",
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
