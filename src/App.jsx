import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import ReportsPage from "./pages/admin/ReportsPage";
import CropsPage from "./pages/admin/CropsPage";
import CropStagesPage from "./pages/admin/CropStagesPage";
import ProductsPage from "./pages/admin/ProductsPage";
import StageProductsPage from "./pages/admin/StageProductsPage";
import EmployeesPage from "./pages/admin/EmployeesPage";

import SubmissionsPage from "./pages/survey/SubmissionsPage";
import SubmissionDetailPage from "./pages/survey/SubmissionDetailPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AppLayout />}>
              <Route index element={<ReportsPage />} />
              <Route path="crops" element={<CropsPage />} />
              <Route path="stages" element={<CropStagesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="stage-products" element={<StageProductsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="submissions" element={<SubmissionsPage />} />
              <Route path="submissions/:id" element={<SubmissionDetailPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["survey_officer"]} />}>
            <Route path="/survey" element={<AppLayout />}>
              <Route index element={<SubmissionsPage />} />
              <Route path=":id" element={<SubmissionDetailPage />} />
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/survey"} replace />;
}
