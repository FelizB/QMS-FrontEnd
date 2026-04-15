// AppRoutes.tsx
import { Routes, Route, Navigate,Outlet } from "react-router-dom";
import Login from "../pages/auth/Login";
import MainLayout from "../components/layout/MainLayout";
import Dashboard from "../pages/dashboards/Dashboard";
import Analytics from "../pages/analytics/Analytics";
import AnalyticsOverview from "../pages/analytics/AnalyticsOverview";
import AnalyticsReports from "../pages/analytics/AnalyticsReports";
import AnalyticsInsights from "../pages/analytics/AnalyticsInsights";
import UsersAllUsers from "../pages/users/UsersAllUsers";
import UsersRoles from "../pages/users/UsersRoles";
import UsersActivity from "../pages/users/UsersActivity";
import WorkspaceManage from "../pages/workspace/WorkspaceManage";
import WorkspacePrograms from "../pages/workspace/WorkspacePrograms";
import WorkspaceProjects from "../pages/workspace/WorkspaceProjects";
import Inventory from "../pages/Inventory";
import Transactions from "../pages/Transactions";
import CalendarPage from "../pages/CalendarPage";
import ReportsPage from "../pages/reports/ReportsPage";
import Settings from "../pages/Settings";
import { AdminUsers } from "../pages/users/AdminUsers";
import SuperPanel from "../pages/SuperPanel";
import { RequireAuth } from "../auth/RequireAuth";
import BootGate from "../components/common/BootGate";
import { BootstrapAuthLogout } from "../auth/AuthLougout";
import ProfilePage from "../components/layout/profile/Profile";

// Projects area
import ProjectAnalytics from "../components/layout/workspaces/projects/ProjectAnalytics";
import ProjectTeams from "../components/layout/workspaces/projects/ProjectsTeams";
import { ProjectTasks } from "../components/layout/workspaces/projects/ProjectTasks";
import ProjectCalendry from "../components/layout/workspaces/projects/ProjectCalendry";
import EditUserPage from "../components/layout/users/userEdit";
import UserRegistrationPage from "../components/layout/users/UserRegistration";
import ApprovalDashboard from "../pages/dashboards/ApprovalDashboard";
import { RouteErrorProvider } from "../lib/errors/RouteErrorContext";
import { RouteMessageProvider } from "../lib/success/RouteMessageContext";
import PortfoliosView from "../components/layout/workspaces/manage/view/PortfolioView";
import ProgramsView from "../components/layout/workspaces/manage/view/ProgramView";
import ProjectsView from "../components/layout/workspaces/manage/view/ProjectView";
import TemplateView from "../components/layout/workspaces/manage/view/TemplateView";
import PortfolioEditor from "../components/layout/workspaces/manage/editors/PortfolioEditor";
import ProgramForm from "../components/layout/workspaces/manage/forms/ProgramForm";

function WorkspaceShell() {
  return <Outlet />;
}

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

            
            <Route path="workspace" element={<WorkspaceShell />}>
              <Route path="manage" element={<WorkspaceManage />}>
                <Route index element={<Navigate to="portfoliosView" replace />} />
                <Route path="portfoliosView" element={<PortfoliosView />} />
                <Route path="programsView" element={<ProgramsView />} />
                <Route path="projectsView" element={<ProjectsView />} />
                <Route path="templatesView" element={<TemplateView />} />
                <Route path="portfoliosView/new" element={<PortfolioEditor />} />
                <Route path="portfoliosView/:id/edit" element={<PortfolioEditor />} />
                <Route path="programsView/new" element={<ProgramForm mode="create" />} />
                <Route path="programsView/:id/edit" element={<ProgramForm mode="edit" />} />
                <Route path="*" element={<Navigate to="portfoliosView" replace />} />
              </Route>
            </Route>

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