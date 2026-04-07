// src/common/useAuthStatus.ts
import * as React from "react";
import { getAccessToken, getRefreshToken, onAuthChanged } from "./authStorage";

export function useAuthStatus() {
  const [, force] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = onAuthChanged(() => force((x) => x + 1));
    // Ensure the effect returns void or a Destructor (void function)
    return () => { unsubscribe(); };
  }, []);

  const isAuthenticated = !!getAccessToken() || !!getRefreshToken();
  return { isAuthenticated };
}