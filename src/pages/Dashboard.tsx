import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import MiniDashboard from '../components/layout/MiniDashboard';
import { useState } from 'react';

export default function Dashboard() {

    const [sideBarCollapsed, setSideBarCollapsed]= useState(false)
    const [currentPage, setCurrentPage]=useState("dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
     
      <div className="flex h-screen overflow-hidden">
         <Sidebar 
          collapsed={sideBarCollapsed}
          ontoggle={()=>setSideBarCollapsed(!sideBarCollapsed)}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
         />
         <div className='flex-1 flex flex-col overflow-hidden'>
          <Header 
            sidebarCollapsed={sideBarCollapsed}
            onToggleSidebar={()=>setSideBarCollapsed(!sideBarCollapsed)}
          />

          <main className='flex-1 overflow-y-auto bg-transparent'>
            <div className='p-6 space--6'>
              {currentPage === "dashboard" && <MiniDashboard/>}
            </div>
         </main>
         </div>

      </div>
    </div>
  );
}