const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const REMEMBER_KEY = "remember_me"; // '1' when checked

const hasWindow = typeof window !== "undefined";
const LS = hasWindow ? window.localStorage : undefined;
const SS = hasWindow ? window.sessionStorage : undefined;

function safeGet(store: Storage | undefined, key: string) {
  try { return store?.getItem(key) ?? null; } catch { return null; }
}
function safeSet(store: Storage | undefined, key: string, val: string | null) {
  try {
    if (!store) return;
    if (val == null) store.removeItem(key);
    else store.setItem(key, val);
  } catch { /* ignore quota/security errors in dev */ }
}

export function getRemember(): boolean {
  return safeGet(LS, REMEMBER_KEY) === "1";
}

export function setRemember(remember: boolean) {
  if (remember) safeSet(LS, REMEMBER_KEY, "1");
  else safeSet(LS, REMEMBER_KEY, null);
}

/**
 * Read initial tokens:
 * - Prefer localStorage if remember==true
 * - Otherwise read sessionStorage
 * - If remember flag missing but tokens exist, prefer localStorage first (migration-friendly)
 */
export function readInitialTokens(): { access: string | null; refresh: string | null; remember: boolean } {
  const remembered = getRemember();
  if (remembered) {
    return {
      access: safeGet(LS, ACCESS_KEY),
      refresh: safeGet(LS, REFRESH_KEY),
      remember: true,
    };
  }
  // Fall back to sessionStorage first, then localStorage (handles old sessions gracefully)
  const accessSS = safeGet(SS, ACCESS_KEY);
  const refreshSS = safeGet(SS, REFRESH_KEY);
  if (accessSS || refreshSS) return { access: accessSS, refresh: refreshSS, remember: false };

  const accessLS = safeGet(LS, ACCESS_KEY);
  const refreshLS = safeGet(LS, REFRESH_KEY);
  if (accessLS || refreshLS) return { access: accessLS, refresh: refreshLS, remember: true };

  return { access: null, refresh: null, remember: false };
}

/** Write both tokens to the chosen storage; clear from the other. */
export function setTokens(tokens: { access: string | null; refresh: string | null }, remember: boolean) {
  // Clear both first
  safeSet(LS, ACCESS_KEY, null); safeSet(LS, REFRESH_KEY, null);
  safeSet(SS, ACCESS_KEY, null); safeSet(SS, REFRESH_KEY, null);
  const store = remember ? LS : SS;
  safeSet(store, ACCESS_KEY, tokens.access);
  safeSet(store, REFRESH_KEY, tokens.refresh);
}

/** Clear tokens from both storages (defensive). */
export function clearTokens() {
  safeSet(LS, ACCESS_KEY, null); safeSet(LS, REFRESH_KEY, null);
  safeSet(SS, ACCESS_KEY, null); safeSet(SS, REFRESH_KEY, null);
}

/** Get current tokens (checks localStorage first, then sessionStorage). */
export function currentAccessToken(): string | null {
  return safeGet(LS, ACCESS_KEY) ?? safeGet(SS, ACCESS_KEY);
}
export function currentRefreshToken(): string | null {
  return safeGet(LS, REFRESH_KEY) ?? safeGet(SS, REFRESH_KEY);
}