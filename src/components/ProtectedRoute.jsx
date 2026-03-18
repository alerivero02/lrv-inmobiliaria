import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../api/client";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
}
