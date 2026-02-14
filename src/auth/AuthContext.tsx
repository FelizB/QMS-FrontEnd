import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

type Decoded = {
  sub?: string;
  username?: string;
  admin?: boolean;
  superuser?: boolean;
  exp?: number;
  [k: string]: unknown;
};

export type User = {
  username: string;
  admin: boolean;
  superuser: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isExpired: () => boolean;
};

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState<User | null>(null);

  const buildUserFromToken = (tok: string | null) => {
    if (!tok) return null;
    try {
      const decoded = jwtDecode<Decoded>(tok);
      const username = (decoded.username || decoded.sub || "") as string;
      const admin = Boolean(decoded.admin);
      const superuser = Boolean(decoded.superuser);
      return { username, admin, superuser };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setUser(buildUserFromToken(token));
  }, [token]);

  const login = (tok: string) => {
    localStorage.setItem("access_token", tok);
    setToken(tok);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  const isExpired = () => {
    if (!token) return true;
    try {
      const { exp } = jwtDecode<Decoded>(token);
      if (!exp) return false;
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  const value = useMemo(() => ({ user, token, login, logout, isExpired }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);