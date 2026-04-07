// src/common/authStorage.ts

export type AuthTokens = {
  access_token: string;
  refresh_token?: string;
};

export type TokenStore = "local" | "session";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

// ---- Reactive event so React can re-render immediately on token changes ----
const listeners = new Set<() => void>();

export function onAuthChanged(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitAuthChanged() {
  listeners.forEach((fn) => fn());
}

// ---- Safe storage helpers ----
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

/**
 * Active store selection:
 * - refresh_token location is authoritative (remember-me vs session)
 * - fallback to access token location
 */
export function getActiveTokenStore(): TokenStore | null {
  if (read(localStorage, REFRESH_KEY)) return "local";
  if (read(sessionStorage, REFRESH_KEY)) return "session";
  if (read(localStorage, ACCESS_KEY)) return "local";
  if (read(sessionStorage, ACCESS_KEY)) return "session";
  return null;
}

/**
 * Read tokens from either store (supports remember-me).
 */
export function getAccessToken(): string | null {
  return read(localStorage, ACCESS_KEY) ?? read(sessionStorage, ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return read(localStorage, REFRESH_KEY) ?? read(sessionStorage, REFRESH_KEY);
}

/**
 * Login-time: explicit store choice based on rememberMe.
 */
export function setTokens(tokens: AuthTokens, rememberMe: boolean) {
  const target = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;

  remove(other, ACCESS_KEY);
  remove(other, REFRESH_KEY);

  write(target, ACCESS_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    write(target, REFRESH_KEY, tokens.refresh_token);
  }

  emitAuthChanged();
}

/**
 * Refresh-time: write back into whichever store is currently active.
 * If no active store can be inferred, default to sessionStorage (safer).
 */
export function setTokensToActiveStore(tokens: AuthTokens) {
  const active = getActiveTokenStore();

  const target = active === "local" ? localStorage : sessionStorage;
  const other = active === "local" ? sessionStorage : localStorage;

  remove(other, ACCESS_KEY);
  remove(other, REFRESH_KEY);

  write(target, ACCESS_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    write(target, REFRESH_KEY, tokens.refresh_token);
  }

  emitAuthChanged();
}

/**
 * Clear from BOTH storages.
 */
export function clearTokens() {
  remove(localStorage, ACCESS_KEY);
  remove(localStorage, REFRESH_KEY);
  remove(sessionStorage, ACCESS_KEY);
  remove(sessionStorage, REFRESH_KEY);

  emitAuthChanged();
}

// ✅ Add to src/common/authStorage.ts// ✅ Add to src/commonconst REFRESH_KEY = "refresh_token";

function safeGet(storage: Storage, key: string) {
  try { return storage.getItem(key); } catch { return null; }
}



export function getActiveStore(): Storage | null {
  if (safeGet(localStorage, REFRESH_KEY)) return localStorage;
  if (safeGet(sessionStorage, REFRESH_KEY)) return sessionStorage;
  if (safeGet(localStorage, ACCESS_KEY)) return localStorage;
  if (safeGet(sessionStorage, ACCESS_KEY)) return sessionStorage;
  return null;
}

export function getActiveAccessToken(): string | null {
  const s = getActiveStore();
  return s ? safeGet(s, ACCESS_KEY) : null;
}

export function getActiveRefreshToken(): string | null {
  const s = getActiveStore();
  return s ? safeGet(s, REFRESH_KEY) : null;
}

/** helper used by all API calls */
export function getAuthHeader(): Record<string, string> | {} {
  const at = getActiveAccessToken();
  return at ? { Authorization: `Bearer ${at}` } : {};
}

export function persistTokens(
  tokens: AuthTokens,
  options?: { rememberMe?: boolean; isRefresh?: boolean }
) {
  const { rememberMe, isRefresh } = options ?? {};

  let target: Storage;
  let other: Storage;

  if (isRefresh) {
    const active = getActiveTokenStore();
    target = active === "local" ? localStorage : sessionStorage;
    other = active === "local" ? sessionStorage : localStorage;
  } else {
    target = rememberMe ? localStorage : sessionStorage;
    other = rememberMe ? sessionStorage : localStorage;
  }

  remove(other, ACCESS_KEY);
  remove(other, REFRESH_KEY);

  write(target, ACCESS_KEY, tokens.access_token);

  if (tokens.refresh_token) {
    write(target, REFRESH_KEY, tokens.refresh_token);
  }

  emitAuthChanged();
}