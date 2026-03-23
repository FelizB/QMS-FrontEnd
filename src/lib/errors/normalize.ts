// src/lib/errors/normalize.ts
import { AxiosError } from 'axios';
import { ERROR_MAP } from './errorMap';
import type{ NormalizedError } from './errorTypes';

const fromBackend = (payload: any): NormalizedError | null => {
  if (!payload) return null;

  // Handles both { error: {...} } and plain {...}
  const e = payload.error ?? payload;

  const code = (e?.code as string | undefined)?.toUpperCase()?.replace(/\s+/g, '_');
  const status = e?.status ?? e?.status_code;
  const message = e?.message ?? e?.detail ?? '';
  const field = e?.details?.field;
  const correlationId = e?.correlation_id || e?.correlationId;

  if (!code && !message && !status) return null;

  const mapped = (code && ERROR_MAP[code]) ? ERROR_MAP[code] : undefined;
  const category = mapped?.category ?? mapByStatus(status);

  return {
    code: code ?? deriveCodeFromStatus(status) ?? 'UNKNOWN_ERROR',
    httpStatus: status,
    userMessage: resolveMessage(mapped?.defaultMessage, { code: code ?? 'UNKNOWN_ERROR', httpStatus: status, userMessage: message, field }),
    devMessage: message,
    field,
    correlationId,
    category,
    retriable: mapped?.retriable,
    raw: payload,
  };
};

const mapByStatus = (status?: number) => {
  if (!status) return undefined;
  if (status === 401) return 'auth';
  if (status === 403) return 'permission';
  if (status === 409) return 'conflict';
  if (status >= 500) return 'server';
  if (status === 422 || status === 400) return 'validation';
  return undefined;
};

const deriveCodeFromStatus = (status?: number) => {
  if (!status) return undefined;
  if (status >= 500) return 'SERVER_ERROR';
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN_ACTION';
  if (status === 409) return 'CONFLICT';
  if (status === 0) return 'NETWORK_ERROR';
  return undefined;
};

const resolveMessage = (
  msg: string | ((e: NormalizedError) => string) | undefined,
  e: NormalizedError
) => {
  if (!msg) return e.userMessage || 'An error occurred.';
  return typeof msg === 'function' ? msg(e) : msg;
};

export const normalizeError = (err: unknown): NormalizedError => {
  // Axios/Orval path
  const ax = err as AxiosError;
  if (ax?.isAxiosError) {
    // network or timeout
    if (!ax.response) {
      return {
        code: 'NETWORK_ERROR',
        userMessage: ERROR_MAP.NETWORK_ERROR.defaultMessage as string,
        category: 'network',
        raw: err,
        retriable: true,
      };
    }
    const data = ax.response?.data;
    const normalized = fromBackend(data);
    if (normalized) return normalized;

    // No structured payload—fallback by status
    const status = ax.response?.status;
    return {
      code: deriveCodeFromStatus(status) ?? 'UNKNOWN_ERROR',
      httpStatus: status,
      userMessage: ERROR_MAP[deriveCodeFromStatus(status) ?? 'UNKNOWN_ERROR']?.defaultMessage as string,
      devMessage: ((data as any)?.detail || (data as any)?.message || ax.message),
      category: mapByStatus(status) ?? 'unknown',
      raw: err,
    };
  }

  // Fetch or thrown strings
  try {
    const maybe = (err as any);
    if (maybe?.error || maybe?.code || maybe?.message) {
      const normalized = fromBackend(maybe);
      if (normalized) return normalized;
    }
  } catch {}

  return {
    code: 'UNKNOWN_ERROR',
    userMessage: ERROR_MAP.UNKNOWN_ERROR.defaultMessage as string,
    raw: err,
    category: 'unknown',
  };
};