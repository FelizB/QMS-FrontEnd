import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import {AdminUsers} from "../pages/AdminUsers";
import SuperPanel from "../pages/SuperPanel";
import { RequireAuth } from "../auth/RequireAuth";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<Login />} />

      {/* Any authenticated user */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      {/* Admin or Superuser only */}
      <Route
        path="/admin/users"
        element={
          <RequireAuth adminOnly>
            <AdminUsers />
          </RequireAuth>
        }
      />

      {/* Superuser only */}
      <Route
        path="/super"
        element={
          <RequireAuth superuserOnly>
            <SuperPanel />
          </RequireAuth>
        }
      />

      <Route path="/unauthorized" element={<div>Unauthorized</div>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}