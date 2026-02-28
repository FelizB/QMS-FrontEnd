// src/sdk/useSyncSdkAuth.ts
import { useEffect } from "react";
import { setSdkTokens } from "../sdk/customInstance";
import { useAuth } from "../auth/AuthContext";

export function useSyncSdkAuth() {
  const { accessToken, refreshToken } = useAuth(); // adapt to your context shape
  useEffect(() => {
    setSdkTokens(accessToken ?? null, refreshToken ?? null);
  }, [accessToken, refreshToken]);
}