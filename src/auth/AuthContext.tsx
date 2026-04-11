import { useCallback } from "react";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import {
  readInitialTokens,
  setTokens,
  clearTokens,
  setRemember,
} from "./tokenStore";
import { setAuthRef } from "./session/authBridge";
import { useProactiveRefresh } from "./useProactiveRefresh";

type Decoded = {
  sub?: string;
  username?: string;
  admin?: boolean;
  superuser?: boolean;
  exp?: number;
};

export type User = {
  username: string;
  admin: boolean;
  superuser: boolean;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  remember: boolean;

  login: (access: string, refresh: string, remember: boolean) => void;
  logout: () => void;
  isExpired: () => boolean;

  // NEW (non-breaking addition)
  updateTokens: (access: string, refresh: string) => void;
};

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const init = readInitialTokens();

  const [accessToken, setAccessToken] = useState<string | null>(init.access);
  const [refreshToken, setRefreshToken] = useState<string | null>(init.refresh);
  const [remember, setRememberState] = useState<boolean>(init.remember);
  const [user, setUser] = useState<User | null>(null);

  // --------------------------
  // DECODE USER FROM TOKEN
  // --------------------------
  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      return;
    }

    let cancelled = false;

    try {
      const decoded = jwtDecode<Decoded>(accessToken);
      const username = (decoded.username || decoded.sub || "") as string;

      if (!cancelled) {
        setUser({
          username,
          admin: !!decoded.admin,
          superuser: !!decoded.superuser,
        });
      }
    } catch {
      // Invalid token → force logout state
      if (!cancelled) {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // --------------------------
  // LOGIN
  // --------------------------
  const login = (
    access: string,
    refresh: string,
    rememberFlag: boolean
  ) => {
    setRemember(rememberFlag);
    setTokens({ access, refresh }, rememberFlag);

    setAccessToken(access);
    setRefreshToken(refresh);
    setRememberState(rememberFlag);
  };

  // --------------------------
  // UPDATE TOKENS (REFRESH)
  // --------------------------

const updateTokens = useCallback((access: string, refresh: string) => {
  setTokens({ access, refresh }, remember);
  setAccessToken(access);
  setRefreshToken(refresh);
}, [remember]);


  // --------------------------
  // LOGOUT
  // --------------------------

const logout = useCallback(() => {
  clearTokens();
  setAccessToken(null);
  setRefreshToken(null);
  setUser(null);
  setRememberState(false);
}, []);


  // --------------------------
  // TOKEN EXPIRY CHECK
  // --------------------------
  const isExpired = () => {
    if (!accessToken) return true;

    try {
      const { exp } = jwtDecode<Decoded>(accessToken);
      return exp ? Date.now() >= exp * 1000 : true;
    } catch {
      return true;
    }
  };

  // --------------------------
  // GLOBAL LOGOUT EVENT
  // --------------------------
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:logout", handler);

    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  // --------------------------
  // BRIDGE → AXIOS (CRITICAL)
  // --------------------------

  useEffect(() => {
    setAuthRef({ accessToken, refreshToken, updateTokens, logout });
  }, [accessToken, refreshToken, updateTokens, logout]);


  // --------------------------
  // MEMO VALUE
  // --------------------------
  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      remember,
      login,
      logout,
      isExpired,
      updateTokens,
    }),
    [user, accessToken, refreshToken, remember]
  );


  useProactiveRefresh({
    thresholdSeconds: 300,       // refresh in last 5 minutes of access token life
    activityWindowSeconds: 120,  // consider active if any activity in last 2 minutes
    leewaySeconds: 60,           // matches your backend JWT_LEEWAY_SECONDS
    cooldownSeconds: 30,         // prevent spamming refresh
    enabled: true,
  });


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);