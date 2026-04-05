// AppRoutes.tsx
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
import WorkspacePortfolios from "../pages/WorkspacePortfolios";
import WorkspacePrograms from "../pages/WorkspacePrograms";
import WorkspaceProjects from "../pages/WorkspaceProjects";
import Inventory from "../pages/Inventory";
import Transactions from "../pages/Transactions";
import CalendarPage from "../pages/CalendarPage";
import ReportsPage from "../pages/ReportsPage";
import Settings from "../pages/Settings";
import { AdminUsers } from "../pages/AdminUsers";
import SuperPanel from "../pages/SuperPanel";
import { RequireAuth } from "../auth/RequireAuth";
import BootGate from "../components/common/BootGate";
import { BootstrapAuthLogout } from "../auth/AuthLougout";
import ProfilePage from "../components/layout/profile/Profile";

// Projects area
import ProjectAnalytics from "../components/layout/workspaces/ProjectAnalytics";
import ProjectTeams from "../components/layout/workspaces/ProjectsTeams";
import { ProjectTasks } from "../components/layout/workspaces/ProjectTasks";
import ProjectCalendry from "../components/layout/workspaces/ProjectCalendry";
import EditUserPage from "../components/layout/users/userEdit";
import UserRegistrationPage from "../components/layout/users/UserRegistration";
import ApprovalDashboard from "../pages/ApprovalDashboard";
import { RouteErrorProvider } from "../lib/errors/RouteErrorContext";
import { RouteMessageProvider } from "../lib/success/RouteMessageContext";

export default function AppRoutes() {
  return (
    <>

      <BootstrapAuthLogout />
      <BootGate>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />

          {/* Authenticated area */}
          <Route
            element={
              <RequireAuth>
                <RouteErrorProvider>
                   <RouteMessageProvider>
                <MainLayout />
                </RouteMessageProvider>
                </RouteErrorProvider>
              </RequireAuth>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="analytics/overview" element={<AnalyticsOverview />} />
            <Route path="analytics/reports" element={<AnalyticsReports />} />
            <Route path="analytics/insights" element={<AnalyticsInsights />} />

            <Route path="users/all-users" element={<UsersAllUsers />} />
            <Route path="/users/:id/edit" element={<EditUserPage/>} />
            <Route path="/users/register" element={<UserRegistrationPage/>} />
            <Route path="users/roles" element={<UsersRoles />} />
            <Route path="users/activity" element={<UsersActivity />} />

            <Route path="workspace/portfolios" element={<WorkspacePortfolios />} />
            <Route path="workspace/programs" element={<WorkspacePrograms />} />

            {/* Projects branch under MainLayout */}
            <Route path="workspace">
              {/* WorkspaceProjects must return <ProjectsLayout/> with its own <Outlet/> */}
              <Route path="projects/*" element={<WorkspaceProjects />}>
                <Route index element={<Navigate to="projectAnalytics" replace />} />
                <Route path="projectAnalytics" element={<ProjectAnalytics />} />
                <Route path="projectTeams" element={<ProjectTeams />} />
                <Route path="projectTasks" element={<ProjectTasks />} />
                <Route path="projectCalendry" element={<ProjectCalendry />} />
                <Route path="*" element={<Navigate to="projectAnalytics" replace />} />
              </Route>
            </Route>

            <Route path="inventory" element={<Inventory />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="report/reports" element={<ReportsPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="tasks" element={<ApprovalDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Admin & Superuser */}
          <Route
            path="/admin/users"
            element={
              <RequireAuth adminOnly>
                <AdminUsers />
              </RequireAuth>
            }
          />
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
      </BootGate>
    </>
  );
}