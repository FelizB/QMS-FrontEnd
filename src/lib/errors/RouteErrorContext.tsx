import React from 'react';

type RouteError = {
  message: string;
  severity?: 'error' | 'warning' | 'info';
};

type RouteErrorCtx = {
  error: RouteError | null;
  setError: (err: RouteError | null) => void;
};

const RouteErrorContext = React.createContext<RouteErrorCtx | undefined>(undefined);

export function RouteErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<RouteError | null>(null);

  return (
    <RouteErrorContext.Provider value={{ error, setError }}>
      {children}
    </RouteErrorContext.Provider>
  );
}

export function useRouteError() {
  const ctx = React.useContext(RouteErrorContext);
  if (!ctx) {
    throw new Error('useRouteError must be used inside RouteErrorProvider');
  }
  return ctx;
}