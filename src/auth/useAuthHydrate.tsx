// src/auth/useAuthHydrate.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";     // must expose { accessToken, isAuthenticated, logout }
import { CurrentUser, type UserData } from "./CurrentUser";

type Ctx = {
  user: UserData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<Ctx | null>(null);

export const UserProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { accessToken, isExpired, logout } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (!accessToken || inflight.current) return;
    inflight.current = true;
    setLoading(true);
    setError(null);
    try {
      const me = await CurrentUser(accessToken);
      setUser(me);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setUser(null);
        logout?.(); // clear stale session
      } else {
        setError(e instanceof Error ? e : new Error("Failed to load current user"));
      }
    } finally {
      setLoading(false);
      inflight.current = false;
    }
  }, [accessToken, logout]);

  // Auto-hydrate when token exists / changes
  useEffect(() => {
    if (!isExpired || !accessToken) {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }
    void refresh();
  }, [isExpired, accessToken, refresh]);

  const value = useMemo(() => ({ user, loading, error, refresh }), [user, loading, error, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUser must be used within <UserProvider>");
  return ctx;
}