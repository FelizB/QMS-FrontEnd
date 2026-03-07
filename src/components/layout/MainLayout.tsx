import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { FullScreenLoader } from '../common/SkeletonLoader';


export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isFetching = useIsFetching();   // number
  const isMutating = useIsMutating();   // number

  const showGlobalLoader = isFetching > 0 || isMutating > 0;


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

        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="p-6 space--6">
            <Outlet />
          </div>
        </main>
        <FullScreenLoader show={showGlobalLoader} message="Loading…" />
      </div>
    </div>
    </div>
  );
}
