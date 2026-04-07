
import { getAccessToken } from "./authStorage";
import { getJwtExpSeconds } from "./jwt";

type ScheduleOptions = {
  warningSeconds: number;  // e.g. 30
  leewaySeconds: number;   // e.g. 60 (your backend leeway)
  onWarn: (remainingSeconds: number) => void;
  onLogout: () => void;
};

let warnTimeout: number | null = null;
let logoutTimeout: number | null = null;

export function clearTokenExpirySchedule() {
  if (warnTimeout) window.clearTimeout(warnTimeout);
  if (logoutTimeout) window.clearTimeout(logoutTimeout);
  warnTimeout = null;
  logoutTimeout = null;
}

export function scheduleFromAccessToken(opts: ScheduleOptions) {
  clearTokenExpirySchedule();

  const token = getAccessToken();
  if (!token) return;

  const exp = getJwtExpSeconds(token); // seconds since epoch
  if (!exp) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const secondsLeft = exp - nowSec;

  // If already expired, logout immediately
  if (secondsLeft <= 0) {
    opts.onWarn(0);
    opts.onLogout();
    return;
  }

  // When to show warning
  const warnAt = Math.max(0, secondsLeft - opts.warningSeconds);

  warnTimeout = window.setTimeout(() => {
    const now2 = Math.floor(Date.now() / 1000);
    const left2 = exp - now2;
    opts.onWarn(Math.max(0, left2));
  }, warnAt * 1000);

  // When to force logout (exp + leeway)
  const logoutAt = Math.max(0, secondsLeft + opts.leewaySeconds);

  logoutTimeout = window.setTimeout(() => {
    opts.onLogout();
  }, logoutAt * 1000);
}
