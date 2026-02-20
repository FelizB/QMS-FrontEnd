import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import MainLayout from "../components/layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import Analytics from "../pages/Analytics";
import AnalyticsOverview from "../pages/AnalyticsOverview";
import AnalyticsReports from "../pages/AnalyticsReports";
import AnalyticsInsights from "../pages/AnalyticsInsights";
import UsersAllUsers from "../pages/UsersAllUsers";
import UsersRoles from "../pages/UsersRoles";
import UsersActivity from "../pages/UsersActivity";
import EcommerceProducts from "../pages/EcommerceProducts";
import EcommerceOrders from "../pages/EcommerceOrders";
import EcommerceCustomers from "../pages/EcommerceCustomers";
import Inventory from "../pages/Inventory";
import Transactions from "../pages/Transactions";
import CalendarPage from "../pages/CalendarPage";
import ReportsPage from "../pages/ReportsPage";
import Settings from "../pages/Settings";
import {AdminUsers} from "../pages/AdminUsers";
import SuperPanel from "../pages/SuperPanel";
import { RequireAuth } from "../auth/RequireAuth";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<Login />} />

      {/* Any authenticated user */}
      {/* authenticated layout + pages */}
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="analytics/overview" element={<AnalyticsOverview />} />
        <Route path="analytics/reports" element={<AnalyticsReports />} />
        <Route path="analytics/insights" element={<AnalyticsInsights />} />
        <Route path="users/all-users" element={<UsersAllUsers />} />
        <Route path="users/roles" element={<UsersRoles />} />
        <Route path="users/activity" element={<UsersActivity />} />
        <Route path="ecommerce/products" element={<EcommerceProducts />} />
        <Route path="ecommerce/orders" element={<EcommerceOrders />} />
        <Route path="ecommerce/customers" element={<EcommerceCustomers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<Settings />} />
      </Route>

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