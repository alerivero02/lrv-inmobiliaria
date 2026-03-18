import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import RequestVisitPage from "./pages/RequestVisitPage";
import AdminLayout from "./pages/admin/AdminLayout";
import LoginPage from "./pages/admin/LoginPage";
import ListingsPage from "./pages/admin/ListingsPage";
import ListingFormPage from "./pages/admin/ListingFormPage";
import VisitsPage from "./pages/admin/VisitsPage";
import AccountingPage from "./pages/admin/AccountingPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import InmobiliariaLaRiojaLanding from "./pages/InmobiliariaLaRiojaLanding";

export default function App() {
  return (
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
  );
}
