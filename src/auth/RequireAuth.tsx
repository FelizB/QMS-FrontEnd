import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
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
  const { user, accessToken, isExpired } = useAuth();
  const location = useLocation();

  // Not logged in or expired → go to login (but avoid looping if we're already on /login)
  if (!accessToken || isExpired()) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    return <>{children}</>;
  }

  // Role gates
  if (superuserOnly && !user?.superuser) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (adminOnly && !user?.admin && !user?.superuser) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}