// e.g., src/app/BootstrapAuthLogout.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { setTokens,getRemember } from "./tokenStore";
import { useUser } from "./useAuthHydrate";

export function BootstrapAuthLogout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setUser } = useUser() as { setUser?: (u: null) => void };

  useEffect(() => {
    const handler = async () => {
      // Clear tokens (store nulls)
      setTokens({ access: null, refresh: null }, getRemember());
      setUser?.(null);
      await qc.clear();
      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [navigate, qc, setUser]);

  return null;
}