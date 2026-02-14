import { Navigate, useLocation } from "react-router-dom";
import  type {ReactNode}  from "react";
import { useAuth } from "./AuthContext";

type RequireAuthProps = {
  children: ReactNode;
  /** If true, allow only admin OR superuser */
  adminOnly?: boolean;
  /** If true, allow only superuser */
  superuserOnly?: boolean;
};

export function RequireAuth({
  children,
  adminOnly = false,
  superuserOnly = false,
}: RequireAuthProps) {
  const { user, token, isExpired } = useAuth();
  const location = useLocation();

  // Not logged in or expired → go to login
  if (!token || isExpired()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  // If you also guard by 'active'/'approved', you can read those from your user or /me

  // Role gates
  if (superuserOnly) {
    if (!user?.superuser) return <Navigate to="/unauthorized" replace />;
  } else if (adminOnly) {
    if (!user?.admin && !user?.superuser) return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}