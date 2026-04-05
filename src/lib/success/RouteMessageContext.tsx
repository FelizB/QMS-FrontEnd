import React from 'react';

export type RouteMessage = {
  message: string;
  severity: 'success' | 'error';
};

type Ctx = {
  msg: RouteMessage | null;
  show: (m: RouteMessage) => void;
  clear: () => void;
};

const RouteMessageContext = React.createContext<Ctx | undefined>(undefined);

export function RouteMessageProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = React.useState<RouteMessage | null>(null);

  const show = (m: RouteMessage) => setMsg(m);
  const clear = () => setMsg(null);

  return (
    <RouteMessageContext.Provider value={{ msg, show, clear }}>
      {children}
    </RouteMessageContext.Provider>
  );
}

export function useRouteMessage() {
  const ctx = React.useContext(RouteMessageContext);
  if (!ctx) throw new Error('useRouteMessage must be used within RouteMessageProvider');
  return ctx;
}