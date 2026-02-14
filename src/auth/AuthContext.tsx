// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  readInitialTokens,
  setTokens,
  clearTokens,
  setRemember,
  getRemember,
} from "./tokenStore";

type Decoded = { sub?: string; username?: string; admin?: boolean; superuser?: boolean; exp?: number };
export type User = { username: string; admin: boolean; superuser: boolean };

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  remember: boolean;
  login: (access: string, refresh: string, remember: boolean) => void;
  logout: () => void;
  isExpired: () => boolean;
};

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const init = readInitialTokens(); // { access, refresh, remember }
  const [accessToken, setAccessToken] = useState<string | null>(init.access);
  const [refreshToken, setRefreshToken] = useState<string | null>(init.refresh);
  const [remember, setRememberState] = useState<boolean>(init.remember);
  const [user, setUser] = useState<User | null>(null);

  // Decode user on access token changes
  useEffect(() => {
    if (!accessToken) { setUser(null); return; }
    try {
      const d = jwtDecode<Decoded>(accessToken);
      const username = (d.username || d.sub || "") as string;
      setUser({ username, admin: !!d.admin, superuser: !!d.superuser });
    } catch { setUser(null); }
  }, [accessToken]);

  const login = (access: string, refresh: string, rememberFlag: boolean) => {
    setRemember(rememberFlag);
    setTokens({ access, refresh }, rememberFlag);
    setAccessToken(access);
    setRefreshToken(refresh);
    setRememberState(rememberFlag);
  };

  const logout = () => {
    clearTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setRememberState(false);
  };

  const isExpired = () => {
    if (!accessToken) return true;
    try {
      const { exp } = jwtDecode<Decoded>(accessToken);
      return exp ? Date.now() >= exp * 1000 : false;
    } catch { return true; }
  };

  // Global logout on refresh failure
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, refreshToken, remember, login, logout, isExpired }),
    [user, accessToken, refreshToken, remember]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);