// src/sdk/customInstance.ts
import axios, { AxiosError, AxiosHeaders } from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

// ---- Tokens wired from your AuthContext ----
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setSdkTokens(at: string | null, rt: string | null) {
  accessToken = at;
  refreshToken = rt;
}

export function setSdkBaseUrl(url: string) {
  instance.defaults.baseURL = url;
}

// ---- Axios instance ----
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://0.0.0.0:8000",
  timeout: 20000,
});

/** Ensure headers are AxiosHeaders, not plain object */
function toAxiosHeaders(h?: AxiosRequestConfig["headers"]): AxiosHeaders {
  if (h instanceof AxiosHeaders) return h;
  const headers = new AxiosHeaders();
  if (h) {
    // copy existing header entries (object/string unions are messy; cast is ok)
    headers.set(h as any);
  }
  return headers;
}

// ---- Request: attach Authorization safely ----
instance.interceptors.request.use((config) => {
  const headers = toAxiosHeaders(config.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  config.headers = headers;
  return config;
});

// ---- Single-flight refresh coordination ----
let refreshing = false;
let waiters: Array<(token: string | null) => void> = [];

async function runRefresh(): Promise<string | null> {
  if (!refreshToken) return null;
  try {
    const res = await axios.post(
      `${instance.defaults.baseURL}/api/v1/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    const newAccess = (res.data as any)?.access_token as string | undefined;
    const newRefresh = (res.data as any)?.refresh_token as string | undefined;
    if (!newAccess) return null;
    setSdkTokens(newAccess, newRefresh ?? refreshToken);
    return newAccess;
  } catch {
    return null;
  }
}

// ---- 401 → refresh (single-flight, queued) ----
instance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }
    if (original._retry) {
      return Promise.reject(error);
    }
    if (!refreshToken) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (refreshing) {
      return new Promise((resolve, reject) => {
        waiters.push((token) => {
          if (!token) return reject(error);
          const headers = toAxiosHeaders(original.headers);
          headers.set("Authorization", `Bearer ${token}`);
          original.headers = headers;
          resolve(instance.request(original));
        });
      });
    }

    refreshing = true;
    const token = await runRefresh();
    refreshing = false;

    waiters.forEach((w) => w(token));
    waiters = [];

    if (!token) {
      return Promise.reject(error);
    }

    const headers = toAxiosHeaders(original.headers);
    headers.set("Authorization", `Bearer ${token}`);
    original.headers = headers;

    return instance.request(original);
  }
);

// ---- Orval mutator: MUST return Promise<AxiosResponse<T>> ----
export const customInstance = <T = unknown>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  config.headers = toAxiosHeaders(config.headers);
  return instance.request<T>(config);
};