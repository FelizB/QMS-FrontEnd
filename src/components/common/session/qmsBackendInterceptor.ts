// src/common/qmsBackendInterceptor.ts

import { emitSessionEvent } from "./sessionEvents";
import { getAccessToken } from "./authStorage";
import { refreshAccessToken } from "./refreshManager";

let wired = false;

function isTokenExpired401(err: any) {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;
  const code =
    typeof detail === "object" && detail !== null ? detail.code : null;

  return status === 401 && code === "TOKEN_EXPIRED";
}

function isRefreshRequest(config: any) {
  const url: string = config?.url ?? "";
  return url.includes("refreshToken") || url.includes("/auth/refresh");
}

export function wireTokenExpiryInterceptor(api: any) {
  if (!api?.interceptors?.request || !api?.interceptors?.response) return;
  if (wired) return;

  wired = true;

  // REQUEST: always attach latest bearer (except refresh)
api.interceptors.request.use((config: any) => {
  if (isRefreshRequest(config)) return config;

  const token = getAccessToken();

  // 🔥 ALWAYS overwrite header (no stale bleed)
  config.headers = {
    ...(config.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
  };
   console.log("AUTH TOKEN USED:", token);
  return config;
});

  // RESPONSE: refresh + retry once
  api.interceptors.response.use(
    (res: any) => res,
    async (err: any) => {
      const original = err?.config ?? {};

      // don’t refresh a refresh call
      if (isRefreshRequest(original)) {
        emitSessionEvent({
          type: "TOKEN_EXPIRED",
          payload: err?.response?.data,
        });
        return Promise.reject(err);
      }

      if (!isTokenExpired401(err)) {
        return Promise.reject(err);
      }

      if (original.__retry) {
        emitSessionEvent({
          type: "TOKEN_EXPIRED",
          payload: err?.response?.data,
        });
        return Promise.reject(err);
      }

      const newToken = await refreshAccessToken();

      if (!newToken) {
        emitSessionEvent({
          type: "TOKEN_EXPIRED",
          payload: err?.response?.data,
        });
        return Promise.reject(err);
      }

      original.__retry = true;

      // 🔥 HARD RESET headers to kill stale Authorization
      original.headers = {
        ...(original.headers || {}),
        Authorization: `Bearer ${newToken}`,
      };

      return api.request(original);
    }
  );
}