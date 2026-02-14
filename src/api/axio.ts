// src/api/axios.ts
import axios from "axios";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  currentAccessToken,
  currentRefreshToken,
  getRemember,
  setTokens,
} from "../auth/tokenStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const REFRESH_URL = "/auth/refresh";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = currentAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh queue
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
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;
}

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/token") || url.includes("/auth/refresh") || url.includes("/auth/logout");

    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const data = await callRefresh();
          const remember = getRemember();
          // Rotate tokens and keep the chosen storage
          setTokens({ access: data.access_token, refresh: data.refresh_token ?? currentRefreshToken() }, remember);
          isRefreshing = false;
          onRefreshed(data.access_token);
        } catch (e) {
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