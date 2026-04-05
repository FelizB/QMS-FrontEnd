import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { FullScreenLoader } from '../common/SkeletonLoader';
import { useRouteError } from '../../lib/errors/RouteErrorContext';
import { useRouteMessage } from '../../lib/success/RouteMessageContext';
import { Alert } from '@mui/material';




export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { error, setError } = useRouteError();
  const { msg, clear } = useRouteMessage();


  const isFetching = useIsFetching();   // number
  const isMutating = useIsMutating();   // number

  const showGlobalLoader = isFetching > 0 || isMutating > 0;

    // Auto-dismiss SUCCESS messages after 10 seconds
  React.useEffect(() => {
    if (msg?.severity === 'success') {
      const timer = setTimeout(() => {
        clear();
      }, 10_000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [msg, clear]);


  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500'>
    <div className="z-10 flex relative h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
      />

      <div className="flex-1 z-50 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto bg-[rgb(var(--secondary))] ">
          <div className="p-6 space-6">
            {error ? (
              <Alert
                severity={error.severity ?? 'error'}
                onClose={() => setError(null)}
              >
                {error.message}
              </Alert>
            ) : msg ? (
              <Alert
                severity={msg.severity}
                onClose={clear}
              >
                {msg.message}
              </Alert>
            ) : null}


            <Outlet />
          </div>
        </main>
        <FullScreenLoader show={showGlobalLoader} message="Loading…" />
      </div>
    </div>
    </div>
  );
}
