import axios from 'axios';
import { normalizeError } from './normalize';

export const http = axios.create({
  withCredentials: true, 
  timeout: 20000,
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const normalized = normalizeError(error);
    // Attach normalized for callers
    (error as any).__normalized = normalized;

    // Optional: global logging/telemetry
    if (import.meta.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[API ERROR]', normalized);
    }

    return Promise.reject(error);
  }
);
