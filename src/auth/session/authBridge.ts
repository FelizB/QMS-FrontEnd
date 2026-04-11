// src/auth/authBridge.ts

type AuthRefType = {
  accessToken: string | null;
  refreshToken: string | null;
  updateTokens: (a: string, r: string) => void;
  logout: () => void;
};

let authRef: AuthRefType | null = null;

export const setAuthRef = (ref: AuthRefType) => {
  authRef = ref;
};

export const getAuthRef = (): AuthRefType => {
  if (!authRef) throw new Error("AuthRef not initialized");
  return authRef;
};