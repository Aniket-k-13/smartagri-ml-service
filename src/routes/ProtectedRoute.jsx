import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guards a route subtree. `allowedRoles` matches the Roles enum in
 * apps/accounts/roles.py: "farmer" | "survey_officer" | "admin".
 * This console only has screens for survey_officer and admin.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
