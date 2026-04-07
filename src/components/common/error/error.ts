// src/common/error.ts
export type AnyError = unknown;

function safeStringify(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

/**
 * Extract a clean user-facing message from Axios/Fetch/FastAPI/Unknown errors.
 * Returns a human-friendly string, never throws.
 */
export function getErrorMessage(err: AnyError, fallback = "Something went wrong"): string {
  if (!err) return fallback;

  // If dev passed a string already
  if (typeof err === "string") return err;

  // Native Error
  if (err instanceof Error) {
    return err.message || fallback;
  }

  // Axios-style error: err.response.data
  const anyErr: any = err as any;
  const data = anyErr?.response?.data ?? anyErr?.data ?? anyErr;

  // If server returned HTML (common when hitting wrong URL)
  if (typeof data === "string" && data.trim().toLowerCase().startsWith("<!doctype")) {
    return "Server returned HTML instead of JSON (check API base URL / route).";
  }

  // 1) FastAPI common shape: { detail: "..." }
  if (typeof data?.detail === "string") return data.detail;

  // 2) Structured shape: { detail: { message, detail, code } }
  if (data?.detail && typeof data.detail === "object") {
    const d = data.detail;
    if (typeof d.message === "string" && d.message.trim()) return d.message;
    if (typeof d.detail === "string" && d.detail.trim()) return d.detail;
    if (typeof d.code === "string" && d.code.trim()) return d.code;
    return safeStringify(d);
  }

  // 3) FastAPI/Pydantic validation: { detail: [ { loc, msg, type }, ... ] }
  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    if (typeof first?.msg === "string") return first.msg;
    return "Validation error";
  }

  // 4) Some APIs: { message: "..." } or { error: "..." }
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;

  // 5) Axios network errors sometimes: err.request exists, no response
  if (anyErr?.request && !anyErr?.response) {
    return "Network error: could not reach server.";
  }

  // 6) Status-based fallback if present
  const status = anyErr?.response?.status;
  if (status) return `Request failed (HTTP ${status}).`;

  // Last resort
  const maybeMsg = (anyErr?.message && String(anyErr.message)) || "";
  return maybeMsg.trim() ? maybeMsg : fallback;
}

/**
 * Optional: extract a machine-readable detail object for logging/diagnostics.
 */
export function getErrorData(err: AnyError): any {
  const anyErr: any = err as any;
  return anyErr?.response?.data ?? anyErr?.data ?? null;
}