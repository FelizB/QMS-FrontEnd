// src/common/sessionEvents.ts

export type TokenExpiredEvent = {
  type: "TOKEN_EXPIRED";
  payload?: any;
};

export type ForceLogoutEvent = {
  type: "FORCE_LOGOUT";
  payload?: any;
};

export type SessionEvent = TokenExpiredEvent | ForceLogoutEvent;

type Listener = (evt: SessionEvent) => void;

const listeners = new Set<Listener>();

export function onSessionEvent(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitSessionEvent(evt: SessionEvent) {
  listeners.forEach((fn) => fn(evt));
}