// src/routes/workspace/projects/ProjectsLayout.tsx
import { Outlet } from 'react-router-dom';
import ProjectsSidebar from './ProjectsSidebar';

export default function ProjectsLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
      <div className="relative h-screen overflow-hidden flex">
        <ProjectsSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Child pages render here */}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}