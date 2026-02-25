import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  currentAccessToken,
  currentRefreshToken,
  getRemember,
  setTokens,
} from "../auth/tokenStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const REFRESH_URL = "/auth/refresh";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000, // <-- fail fast after 8s
});

// Attach Authorization
api.interceptors.request.use((config) => {
  const token = currentAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Refresh Queue (as you already have) ----
let isRefreshing = false;
type Subscriber = (token: string) => void;
const subscribers: Subscriber[] = [];
const subscribeTokenRefresh = (cb: Subscriber) => subscribers.push(cb);
const onRefreshed = (newToken: string) => { subscribers.forEach(cb => cb(newToken)); subscribers.length = 0; };

async function callRefresh(): Promise<{ access_token: string; refresh_token?: string }> {
  const rt = currentRefreshToken();
  if (!rt) throw new Error("No refresh token");
  const res = await axios.post<{ access_token: string; refresh_token?: string }>(
    BASE_URL + REFRESH_URL,
    { refresh_token: rt },
    { headers: { "Content-Type": "application/json" }, timeout: 8000 }
  );
  return res.data;
}

/** Helper to detect network-level failures (server down, DNS, CORS block, timeout). */
function isNetworkError(err: AxiosError) {
  return !!(
    err.code === "ECONNABORTED" ||                  // timeout
    err.message?.includes("Network Error") ||       // generic network
    err.message?.includes("Failed to fetch") ||     // fetch-like adapters
    (!err.response && err.request)                  // no response received
  );
}

/** ADDED: Extract API error "code" from our backend's shapes */
function extractApiCode(data: any): string | undefined {
  if (!data) return;
  if (typeof data.code === "string") return data.code;
  if (typeof data.error === "string") return data.error;
  if (data.detail) {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.detail.code === "string") return data.detail.code;
  }
}

/** ADDED: 401 codes that should NOT trigger refresh; we log out immediately */
const AUTH_401_STOP = new Set(["TOKEN_INVALIDATED", "USER_LOGGED_OUT", "REFRESH_REVOKED", "NO_AUTH"]);

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/token") || url.includes("/auth/refresh") || url.includes("/auth/logout");

    // ---- Normalize network errors so UI can show a clear message
    if (isNetworkError(error)) {
      error.message = "Cannot reach the server. Check your connection or try again.";
      return Promise.reject(error);
    }

    // ADDED: Short-circuit for explicit auth errors (do NOT attempt refresh)
    if (status === 401) {
      const apiCode = extractApiCode(error.response?.data);
      if (apiCode && AUTH_401_STOP.has(apiCode)) {
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(error);
      }
    }

    // ---- 401 handling with refresh (unchanged)
    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const data = await callRefresh();
          const remember = getRemember();
          setTokens({ access: data.access_token, refresh: data.refresh_token ?? currentRefreshToken() }, remember);
          isRefreshing = false;
          onRefreshed(data.access_token);
        } catch {
          isRefreshing = false;
          window.dispatchEvent(new Event("auth:logout"));
          return Promise.reject(error);
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          if (!original.headers) original.headers = {};
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api.request(original));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;





/* =======================
   ADDED: logout API helper
   ======================= */

export type LogoutResponse = { code: string; message: string; details?: string | null };

/** Call backend logout and normalize 200/202/204/401 */
export async function postLogout(): Promise<LogoutResponse | null> {
  const rt = currentRefreshToken();
  const res = await api.post<LogoutResponse>(
    "/auth/logout",
    rt ? { refresh_token: rt } : undefined,
    { validateStatus: (s) => [200, 202, 204, 401].includes(s) }
  );

  if (res.status === 204) {
    return { code: "LOGOUT_SUCCESS", message: "Logged out successfully.", details: null };
  }
  if (res.status === 401) {
    return { code: "ALREADY_LOGGED_OUT", message: "Session already ended.", details: null };
  }
  return res.data ?? { code: "LOGOUT_SUCCESS", message: "Logged out.", details: null };
}