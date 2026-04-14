import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { lazyWithRetry } from "./utils/lazyRetry";

const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const PropertiesPage = lazyWithRetry(() => import("./pages/PropertiesPage"));
const PropertyDetailPage = lazyWithRetry(() => import("./pages/PropertyDetailPage"));
const RequestVisitPage = lazyWithRetry(() => import("./pages/RequestVisitPage"));
const InmobiliariaLaRiojaLanding = lazyWithRetry(
  () => import("./pages/InmobiliariaLaRiojaLanding"),
);
const LoginPage = lazyWithRetry(() => import("./pages/admin/LoginPage"));
const AdminLayout = lazyWithRetry(() => import("./pages/admin/AdminLayout"));
const DashboardPage = lazyWithRetry(() => import("./pages/admin/DashboardPage"));
const ListingsPage = lazyWithRetry(() => import("./pages/admin/ListingsPage"));
const ListingFormPage = lazyWithRetry(() => import("./pages/admin/ListingFormPage"));
const VisitsPage = lazyWithRetry(() => import("./pages/admin/VisitsPage"));
const AccountingPage = lazyWithRetry(() => import("./pages/admin/AccountingPage"));
const UsersPage = lazyWithRetry(() => import("./pages/admin/UsersPage"));
const ActivateAccountPage = lazyWithRetry(() => import("./pages/admin/ActivateAccountPage"));
const ForgotPasswordPage = lazyWithRetry(() => import("./pages/admin/ForgotPasswordPage"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/admin/ResetPasswordPage"));

function RouteFallback() {
  return (
    <div className="route-fallback" aria-busy="true" aria-live="polite">
      <span className="route-fallback__dot" aria-hidden />
      <span>Cargando…</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/propiedades" element={<PropertiesPage />} />
        <Route path="/propiedades/:id" element={<PropertyDetailPage />} />
        <Route path="/propiedades/:id/solicitar-visita" element={<RequestVisitPage />} />
        <Route path="/demo/la-rioja" element={<InmobiliariaLaRiojaLanding />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/olvide-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/admin/restablecer-contrasena" element={<ResetPasswordPage />} />
        <Route path="/admin/activar-cuenta" element={<ActivateAccountPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="anuncios" element={<ListingsPage />} />
          <Route path="nuevo" element={<ListingFormPage />} />
          <Route path="editar/:id" element={<ListingFormPage />} />
          <Route path="visitas" element={<VisitsPage />} />
          <Route path="contabilidad" element={<AccountingPage />} />
          <Route path="usuarios" element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
