import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const PropertiesPage = lazy(() => import("./pages/PropertiesPage"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage"));
const RequestVisitPage = lazy(() => import("./pages/RequestVisitPage"));
const InmobiliariaLaRiojaLanding = lazy(() => import("./pages/InmobiliariaLaRiojaLanding"));
const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const ListingsPage = lazy(() => import("./pages/admin/ListingsPage"));
const ListingFormPage = lazy(() => import("./pages/admin/ListingFormPage"));
const VisitsPage = lazy(() => import("./pages/admin/VisitsPage"));
const AccountingPage = lazy(() => import("./pages/admin/AccountingPage"));

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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
