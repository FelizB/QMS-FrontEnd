// src/session/SessionProvider.tsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Dialog,DialogTitle,DialogContent,DialogActions,Box,Typography,Button } from "@mui/material";
import { useProactiveRefresh } from "../useProactiveRefresh";

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 min
const WARNING_TIME = 30 * 1000; // 1 min
const COUNTDOWN = 30;


export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const lastActivity = useRef(Date.now());
  const timers = useRef<any>({});
  const countdownInterval = useRef<any>(null);

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN);

  // --------------------------
  // CLEANUP EVERYTHING
  // --------------------------
  const clearAllTimers = () => {
    Object.values(timers.current).forEach((id) => {
        if (id) clearTimeout(id as number);
        });
    timers.current = {};

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };

  // --------------------------
  // LOGOUT HANDLER
  // --------------------------
  const handleLogout = () => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(COUNTDOWN);

    logout();
    navigate("/login");
  };

  // --------------------------
  // COUNTDOWN
  // --------------------------
const startCountdown = () => {
  let time = WARNING_TIME / 1000;
  setCountdown(time);

  countdownInterval.current = setInterval(() => {
    time -= 1;
    setCountdown(time);

    if (time <= 0) {
      clearInterval(countdownInterval.current);
      handleLogout();
    }
  }, 1000);
};

  // --------------------------
  // TIMERS
  // --------------------------
  const startTimers = () => {
    clearAllTimers();

    timers.current.warning = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, IDLE_TIMEOUT - WARNING_TIME);
  };

  // --------------------------
  // ACTIVITY RESET
  // --------------------------
const resetActivity = () => {

  if (showWarning) return;

  lastActivity.current = Date.now();
  startTimers();
};

const staySignedIn = () => {
  setShowWarning(false);
  lastActivity.current = Date.now();
  startTimers();
};
  // --------------------------
  // TRACK USER ACTIVITY
  // --------------------------
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];

    const handler = () => resetActivity();

    events.forEach(e => window.addEventListener(e, handler));

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
    };
  }, [showWarning]);

  // --------------------------
  // AUTH STATE CONTROL (CRITICAL FIX)
  // --------------------------
  useEffect(() => {
    if (!accessToken) {
      // user logged out → kill everything
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    // user logged in → start fresh
    startTimers();

        return () => {
        clearAllTimers();
        };
    }, [accessToken]);

    useEffect(() => {
    const onGlobalLogout = () => {
        clearAllTimers();
        setShowWarning(false);
        setCountdown(60);
    };

    window.addEventListener("auth:logout", onGlobalLogout);
    return () => window.removeEventListener("auth:logout", onGlobalLogout);
    }, []);

    

  return (
    <>
      {children}

      {accessToken && showWarning && (
        <Dialog open={true} maxWidth="xs" fullWidth>
            <DialogTitle className="text-[rgb(var(--text))]">
            Session expiring soon
            </DialogTitle>

            <DialogContent>
            <Typography variant="body2" sx={{ color: "rgb(var(--subtle))" }}>
                Your session will expire soon. Stay signed in to continue.
            </Typography>

            <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: "rgb(var(--muted))" }}>
                Logging out in <b>{countdown}</b> seconds…
                </Typography>
            </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" onClick={handleLogout}>
                Logout
            </Button>

            <Button variant="contained" onClick={staySignedIn}>
                Stay signed in
            </Button>
            </DialogActions>
      </Dialog>

      )}
    </>
  );
};