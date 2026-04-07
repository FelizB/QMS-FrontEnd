import * as React from "react";
import { scheduleFromAccessToken, clearTokenExpirySchedule } from "./tokenExpiryScheduler";
import { useLocation, useNavigate } from "react-router-dom";
import { onSessionEvent } from "./sessionEvents";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { onAuthChanged, getAccessToken, getRefreshToken, clearTokens } from "./authStorage";
import { refreshAccessToken } from "./refreshManager";
import { darkText } from "../T-colors";


type Props = {
  children: React.ReactNode;
  loginPath?: string;
  warningSeconds?: number;
  leewaySeconds?: number;

  /** NEW: how long user must be idle before showing warning */
  idleThresholdMs?: number;
};

export function SessionProvider({
  children,
  loginPath = "/login",
  warningSeconds = 30,
  leewaySeconds = 60,
  idleThresholdMs = 30000, // 30s idle requirement
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  // force re-render on token change
  const [, bump] = React.useState(0);
  React.useEffect(() => {
    const unsub = onAuthChanged(() => bump((x) => x + 1));
    return () => {
      unsub();
    };
  }, []);

  const isAuthenticated = !!getAccessToken() || !!getRefreshToken();
  const isOnLogin = location.pathname.startsWith(loginPath);

  const [open, setOpen] = React.useState(false);
  const [remaining, setRemaining] = React.useState<number>(warningSeconds);

  const countdownRef = React.useRef<number | null>(null);

  // 🔥 NEW: track user activity
  const lastActivityRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, updateActivity));

    return () => {
      events.forEach((e) => window.removeEventListener(e, updateActivity));
    };
  }, []);

  const stopCountdown = React.useCallback(() => {
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    countdownRef.current = null;
  }, []);

  const logout = React.useCallback(() => {
    stopCountdown();
    clearTokenExpirySchedule();
    setOpen(false);

    clearTokens();

    if (!location.pathname.startsWith(loginPath)) {
      navigate(loginPath, { replace: true });
    }
  }, [stopCountdown, navigate, loginPath, location.pathname]);

  const startCountdown = React.useCallback(
    (secondsLeft: number) => {
      if (!isAuthenticated || isOnLogin) return;

      stopCountdown();

      const start = Math.max(0, Math.min(warningSeconds, Math.floor(secondsLeft)));
      setRemaining(start);
      setOpen(true);

      countdownRef.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            stopCountdown();
            logout();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    },
    [isAuthenticated, isOnLogin, warningSeconds, stopCountdown, logout]
  );

  // 🔥 MODIFIED: expiry + idle awareness
  React.useEffect(() => {
    if (!isAuthenticated || isOnLogin) {
      stopCountdown();
      clearTokenExpirySchedule();
      setOpen(false);
      return;
    }

    scheduleFromAccessToken({
      warningSeconds,
      leewaySeconds,
        onWarn: (left) => {
          const checkInterval = 2000; // check every 2s
          let attempts = 0;
          const maxAttempts = Math.ceil((left * 1000) / checkInterval);

          const interval = setInterval(() => {
            const idleTime = Date.now() - lastActivityRef.current;

            if (idleTime >= idleThresholdMs) {
              clearInterval(interval);
              startCountdown(left);
            }

            attempts++;

            // If we run out of time, show anyway (token is expiring)
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              startCountdown(left);
            }
          }, checkInterval);
        },
      onLogout: () => logout(),
    });

    return () => clearTokenExpirySchedule();
  }, [
    isAuthenticated,
    isOnLogin,
    warningSeconds,
    leewaySeconds,
    idleThresholdMs,
    startCountdown,
    logout,
    stopCountdown,
  ]);

  // backend-triggered expiry (refresh failed)
  React.useEffect(() => {
    if (!isAuthenticated || isOnLogin) return;

    const unsub = onSessionEvent((evt) => {
      if (evt.type === "TOKEN_EXPIRED") {
        startCountdown(warningSeconds);
      }
      if (evt.type === "FORCE_LOGOUT") {
        logout();
      }
    });

    return () => { unsub?.(); };
  }, [isAuthenticated, isOnLogin, startCountdown, logout, warningSeconds]);

  const staySignedIn = async () => {
    const rt = getRefreshToken();
    if (!rt) return logout();

    const newToken = await refreshAccessToken();
    if (!newToken) return logout();

    stopCountdown();
    setOpen(false);

    const at = getAccessToken();
    if (at) {
      scheduleFromAccessToken({
        warningSeconds,
        leewaySeconds,
        onWarn: (left) => startCountdown(left),
        onLogout: () => logout(),
      });
    }
  };

  return (
    <>
      {children}

      <Dialog open={open && isAuthenticated && !isOnLogin} maxWidth="xs" fullWidth>
        <DialogTitle className="text-[rgb(var(--text))]">
          Session expiring soon
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ color: "rgb(var(--subtle))" }}>
            Your session will expire soon. Stay signed in to continue.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: "rgb(var(--muted))" }}>
              Logging out in <b>{remaining}</b> seconds…
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={logout}>
            Logout
          </Button>

          <Button variant="contained" onClick={staySignedIn}>
            Stay signed in
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}