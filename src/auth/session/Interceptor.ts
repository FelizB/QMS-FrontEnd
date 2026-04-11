import axios from "axios";
import { getAuthRef } from "./authBridge";
import { currentAccessToken,currentRefreshToken } from "../tokenStore";


const api = axios.create({
  baseURL: "/api",
});

let isRefreshing = false;
let queue: any[] = [];

const processQueue = (error: any, token: string | null) => {
  queue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

// Attach access token


api.interceptors.request.use(config => {
  const access = currentAccessToken();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

// Handle refresh
api.interceptors.response.use(
    
  res => res,
  async error => {
    const original = error.config;
    const {updateTokens, logout } = getAuthRef();

    if (error.response?.status === 401 && !original._retry) {
      const currentAccess = currentAccessToken();
      const currentRefresh = currentRefreshToken();

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => api(original));
      }

      original._retry = true;
      isRefreshing = true;


      try {

        const res = await axios.post(
        "/auth/refresh",
        { refreshToken: currentRefresh },
        {
            headers: {
            Authorization: currentAccess ? `Bearer ${currentAccess}` : "",
            },
        }
        );


        const { access, refresh } = res.data;

        updateTokens(access, refresh);
        api.defaults.headers.common.Authorization = `Bearer ${access}`;
        original.headers.Authorization = `Bearer ${access}`;

        processQueue(null, access);
        return api(original);
      } catch (err) {
        processQueue(err, null);
        logout();
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;