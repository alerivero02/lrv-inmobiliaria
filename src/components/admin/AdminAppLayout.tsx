"use client";

import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
} from "@mui/material";
import {
  Bell,
  Calendar,
  ClipboardList,
  FileText,
  Globe,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, matchPath, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  changePassword,
  getNotificationCounts,
  getStoredAdminProfile,
  isAuthenticated,
  logout,
  refreshAdminProfile,
} from "@/api/client";
import AdminMain from "@/components/admin/AdminMain";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSeo } from "@/hooks/useSeo";
import { adminTheme } from "@/theme/adminTheme";

const mainNav = [
  { to: "/admin", end: true, label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/anuncios", end: false, label: "Anuncios", Icon: FileText },
  { to: "/admin/nuevo", end: false, label: "Nuevo anuncio", Icon: PlusCircle },
  { to: "/admin/visitas", end: false, label: "Visitas", Icon: Calendar },
  { to: "/admin/contabilidad", end: false, label: "Contabilidad", Icon: Landmark },
] as const;

const usersItem = {
  to: "/admin/usuarios",
  end: false,
  label: "Usuarios",
  Icon: Users,
} as const;

function SidebarNavItem({
  to,
  end,
  label,
  Icon,
  onNavClick,
}: {
  to: string;
  end?: boolean;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onNavClick?: () => void;
}) {
  const { pathname } = useLocation();
  const isActive = matchPath({ path: to, end: end ?? false }, pathname) !== null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <NavLink to={to} end={end} onClick={onNavClick}>
          <Icon className="size-4 shrink-0" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AdminSidebarNav({
  onNavClick,
  profile,
}: {
  onNavClick?: () => void;
  profile: ReturnType<typeof getStoredAdminProfile>;
}) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [counts, setCounts] = useState({ pending_visits: 0, pending_listings: 0 });
  const [pwdOpen, setPwdOpen] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdSnack, setPwdSnack] = useState("");

  const visitasActive = matchPath({ path: "/admin/visitas", end: false }, pathname) !== null;
  const publicacionesActive = pathname === "/admin/anuncios" && search.includes("pending_review");

  const sidebarNav = useMemo(() => {
    if (profile?.role === "admin") {
      const next = [...mainNav];
      next.splice(4, 0, usersItem);
      return next;
    }
    return mainNav;
  }, [profile]);

  useEffect(() => {
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      getNotificationCounts()
        .then(setCounts)
        .catch(() => {});
    };
    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const t = setInterval(refresh, 60000);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handlePwdClose = () => {
    if (pwdBusy) return;
    setPwdOpen(false);
    setPwdErr("");
    setCurPw("");
    setNewPw("");
    setNewPw2("");
  };

  const handlePwdSubmit = async (e: React.FormEvent) => {
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
    } catch (err: unknown) {
      setPwdErr(err instanceof Error ? err.message : "Error");
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link
          to="/admin"
          onClick={onNavClick}
          className="flex flex-col gap-0.5 rounded-md px-1 outline-none ring-sidebar-ring focus-visible:ring-2"
        >
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">LRV</span>
          <span className="text-xs text-muted-foreground">Panel de gestión</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Atajos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={visitasActive} tooltip="Visitas">
                  <NavLink to="/admin/visitas" onClick={onNavClick}>
                    <Bell className="size-4 shrink-0" />
                    <span>Visitas</span>
                    {counts.pending_visits > 0 ? (
                      <SidebarMenuBadge className="bg-amber-500/20 text-amber-800 dark:text-amber-200">
                        {counts.pending_visits}
                      </SidebarMenuBadge>
                    ) : null}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={publicacionesActive} tooltip="En revisión">
                  <NavLink to="/admin/anuncios?status=pending_review" onClick={onNavClick}>
                    <ClipboardList className="size-4 shrink-0" />
                    <span>Publicaciones</span>
                    {counts.pending_listings > 0 ? (
                      <SidebarMenuBadge className="bg-amber-500/20 text-amber-800 dark:text-amber-200">
                        {counts.pending_listings}
                      </SidebarMenuBadge>
                    ) : null}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarNav.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? item.end : undefined}
                  label={item.label}
                  Icon={item.Icon}
                  onNavClick={onNavClick}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {profile?.email ? (
          <div className="mb-2 px-2 text-xs">
            <p className="text-muted-foreground">Sesión</p>
            <p className="truncate font-medium text-sidebar-foreground">{profile.email}</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" className="justify-start" asChild>
            <Link to="/" onClick={onNavClick}>
              <Globe className="size-4" />
              Ver sitio público
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => setPwdOpen(true)}
          >
            <KeyRound className="size-4" />
            Cambiar contraseña
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </SidebarFooter>

      <Dialog
        open={pwdOpen}
        onClose={handlePwdClose}
        fullWidth
        maxWidth="xs"
        component="form"
        onSubmit={handlePwdSubmit}
      >
        <DialogTitle sx={{ fontFamily: adminTheme.typography.h5.fontFamily }}>
          Cambiar contraseña
        </DialogTitle>
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
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button type="button" variant="outline" onClick={handlePwdClose} disabled={pwdBusy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pwdBusy}>
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

export default function AdminAppLayout() {
  const location = useLocation();
  useSeo({
    title: "Panel administración",
    description: "Acceso al panel de gestión LRV Inmobiliaria.",
    canonicalPath: location.pathname,
    noIndex: true,
  });

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

  return (
    <AdminProviders>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="inset">
          <AdminSidebarNav profile={profile} />
          <SidebarRail />
        </Sidebar>
        <SidebarInset
          className="theme bg-muted/30 min-h-0 min-h-svh max-w-full overflow-x-hidden"
          data-admin-shell
        >
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-md sm:px-4 md:px-6">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="mr-1 hidden h-6 sm:mr-2 sm:block" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">LRV Admin</span>
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                Inmobiliaria · gestión
              </span>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 md:px-8 md:py-6">
            <AdminMain>
              <Outlet />
            </AdminMain>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminProviders>
  );
}
