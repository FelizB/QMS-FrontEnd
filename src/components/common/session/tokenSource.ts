// src/common/tokenSource.ts

export type AuthTokens = {
  access_token: string;
  refresh_token?: string;
};

type StoreKind = "local" | "session";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

let memAccess: string | null = null;
let memRefresh: string | null = null;

/** reactive listeners */
const listeners = new Set<() => void>();

export function onTokenChanged(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn());
}

/** safe storage helpers */
function read(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function write(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {}
}

function remove(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {}
}

/** determine active store */
function activeStore(): StoreKind | null {
  // Refresh token decides active store (best signal for remember-me)
  if (read(localStorage, REFRESH_KEY)) return "local";
  if (read(sessionStorage, REFRESH_KEY)) return "session";
  if (read(localStorage, ACCESS_KEY)) return "local";
  if (read(sessionStorage, ACCESS_KEY)) return "session";
  return null;
}

/** sync memory with storage */
function syncFromStorage() {
  memAccess =
    read(localStorage, ACCESS_KEY) ??
    read(sessionStorage, ACCESS_KEY);

  memRefresh =
    read(localStorage, REFRESH_KEY) ??
    read(sessionStorage, REFRESH_KEY);
}

// initialize memory
syncFromStorage();

/** getters */
export function getAccessToken(): string | null {
  return memAccess;
}

export function getRefreshToken(): string | null {
  return memRefresh;
}

export function isAuthenticated(): boolean {
  return !!memAccess || !!memRefresh;
}

/** clear everything */
export function clearTokens() {
  remove(localStorage, ACCESS_KEY);
  remove(localStorage, REFRESH_KEY);
  remove(sessionStorage, ACCESS_KEY);
  remove(sessionStorage, REFRESH_KEY);

  memAccess = null;
  memRefresh = null;

  emit();
}

/** called right after login */
export function setTokensForLogin(tokens: AuthTokens, rememberMe: boolean) {
  const target = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;

  remove(other, ACCESS_KEY);
  remove(other, REFRESH_KEY);

  write(target, ACCESS_KEY, tokens.access_token);

  if (tokens.refresh_token) {
    write(target, REFRESH_KEY, tokens.refresh_token);
  }

  memAccess = tokens.access_token;
  memRefresh = tokens.refresh_token ?? memRefresh;

  emit();
}

/** called after refresh */
export function setTokensForRefresh(tokens: AuthTokens) {
  const active = activeStore();

  const target = active === "local" ? localStorage : sessionStorage;
  const other = active === "local" ? sessionStorage : localStorage;

  remove(other, ACCESS_KEY);
  remove(other, REFRESH_KEY);

  write(target, ACCESS_KEY, tokens.access_token);

  if (tokens.refresh_token) {
    write(target, REFRESH_KEY, tokens.refresh_token);
  }

  memAccess = tokens.access_token;
  memRefresh = tokens.refresh_token ?? memRefresh;

  emit();
}