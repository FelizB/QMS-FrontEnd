// src/auth/useProactiveRefresh.ts
import { useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { currentAccessToken, currentRefreshToken } from "./tokenStore";
import { getAuthRef } from "./session/authBridge";

type Decoded = { exp?: number };

type Options = {
  /** Refresh when token is within this many seconds of exp. */
  thresholdSeconds?: number; // default 300 (5 min)
  /** Treat user as "active" if activity occurred within this window. */
  activityWindowSeconds?: number; // default 120 (2 min)
  /** Clock skew/leeway to avoid edge-of-expiry races. */
  leewaySeconds?: number; // default 60
  /** Minimum time between proactive refresh attempts (avoid loops). */
  cooldownSeconds?: number; // default 30
  /** Enable/disable hook easily */
  enabled?: boolean;
};

/**
 * Proactive, activity-aware token refresh:
 * - Schedules a refresh shortly before access token expiry.
 * - Only refreshes if user is active recently OR tab is visible/focused.
 * - Uses tokenStore (storage) as source of truth to avoid stale React state.
 */
export function useProactiveRefresh(options: Options = {}) {
  const {
    thresholdSeconds = 300,
    activityWindowSeconds = 120,
    leewaySeconds = 60,
    cooldownSeconds = 30,
    enabled = true,
  } = options;

  const lastActivityRef = useRef<number>(Date.now());
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null);
  const lastRefreshAttemptRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const isBrowser = typeof window !== "undefined";

  const now = () => Date.now();

  const clearTimer = () => {
    if (!isBrowser) return;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const markActivity = () => {
    lastActivityRef.current = now();
  };

  const isUserRecentlyActive = () => {
    const deltaMs = now() - lastActivityRef.current;
    return deltaMs <= activityWindowSeconds * 1000;
  };

  const isForeground = () => {
    if (!isBrowser) return false;
    return document.visibilityState === "visible" && document.hasFocus();
  };

  const decodeExpMs = (token: string): number | null => {
    try {
      const decoded = jwtDecode<Decoded>(token);
      if (!decoded.exp) return null;
      return decoded.exp * 1000;
    } catch {
      return null;
    }
  };

  const shouldRefreshNow = (access: string) => {
    const expMs = decodeExpMs(access);
    if (!expMs) return false;

    const refreshAtMs = expMs - (thresholdSeconds + leewaySeconds) * 1000;
    return now() >= refreshAtMs;
  };

  const scheduleNextCheck = (access: string | null) => {
    if (!isBrowser) return;
    clearTimer();

    if (!access) return;

    const expMs = decodeExpMs(access);
    if (!expMs) return;

    // Schedule at exp - threshold - leeway, but not in the past
    const targetMs = expMs - (thresholdSeconds + leewaySeconds) * 1000;
    const delayMs = Math.max(0, targetMs - now());

    // Add a small jitter to avoid herd behavior if many clients refresh at same time
    const jitterMs = Math.floor(Math.random() * 2000);

    timerRef.current = window.setTimeout(() => {
      // On timer fire, attempt refresh (activity-aware)
      void maybeRefresh("timer");
    }, delayMs + jitterMs);
  };

  const doRefresh = async (): Promise<string | null> => {
    // Cooldown check
    const lastAttempt = lastRefreshAttemptRef.current;
    if (now() - lastAttempt < cooldownSeconds * 1000) {
      return null;
    }
    lastRefreshAttemptRef.current = now();

    const access = currentAccessToken();
    const refresh = currentRefreshToken();

    if (!access || !refresh) {
      window.dispatchEvent(new Event("auth:logout"));
      return null;
    }

    try {
      // IMPORTANT: call refresh using axios (not your api instance) to avoid interceptor recursion
      const res = await axios.post(
        "/auth/refresh",
        { refreshToken: refresh },
        {
          headers: { Authorization: `Bearer ${access}` },
        }
      );

      // Adjust these keys if your backend returns different names
      const { access: newAccess, refresh: newRefresh } = res.data ?? {};
      if (!newAccess || !newRefresh) {
        throw new Error("Refresh response missing tokens");
      }

      // Update through AuthRef (updates storage + state via updateTokens)
      const { updateTokens } = getAuthRef();
      updateTokens(newAccess, newRefresh);

      return newAccess as string;
    } catch (e) {
      // On any refresh failure, force logout globally
      window.dispatchEvent(new Event("auth:logout"));
      return null;
    }
  };

  const maybeRefresh = async (reason: "timer" | "focus" | "visibility" | "activity") => {
    if (!enabled || !isBrowser) return;

    const access = currentAccessToken();
    if (!access) return;

    // Only refresh near expiry
    if (!shouldRefreshNow(access)) {
      // Reschedule based on latest token
      scheduleNextCheck(access);
      return;
    }

    // Activity-aware rule:
    // - If user is recently active OR app is in foreground → allow refresh
    // - Otherwise, skip (user idle/background)
    if (!(isUserRecentlyActive() || isForeground())) {
      // Try again soon-ish but don't spam
      clearTimer();
      timerRef.current = window.setTimeout(() => void maybeRefresh("timer"), 30_000);
      return;
    }

    // Prevent concurrent refreshes
    if (!refreshInFlightRef.current) {
      refreshInFlightRef.current = doRefresh().finally(() => {
        refreshInFlightRef.current = null;
      });
    }

    const newAccess = await refreshInFlightRef.current;
    scheduleNextCheck(newAccess ?? currentAccessToken());
  };

  // Track activity events (lightweight)
  useEffect(() => {
    if (!enabled || !isBrowser) return;

    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "scroll"];
    const handler = () => {
      markActivity();
      // If user becomes active and token is near expiry, refresh
      void maybeRefresh("activity");
    };

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Refresh when tab gains focus / becomes visible
  useEffect(() => {
    if (!enabled || !isBrowser) return;

    const onFocus = () => void maybeRefresh("focus");
    const onVisibility = () => {
      if (document.visibilityState === "visible") void maybeRefresh("visibility");
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Schedule based on the current access token, and reschedule when tokens change.
  // We can’t directly subscribe to storage changes reliably, but we *can* reschedule periodically
  // and rely on your AuthProvider re-render updates + focus/activity triggers.
  useEffect(() => {
    if (!enabled || !isBrowser) return;

    const access = currentAccessToken();
    scheduleNextCheck(access);

    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, thresholdSeconds, leewaySeconds]);
}
