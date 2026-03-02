// components/layout/workspaces/ProjectsSidebar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Users2, ListChecks, CalendarDays } from 'lucide-react';
import { ToggleButton } from '../Elements/ToggleButton';

const tabs = [
  { id: 'projectAnalytics', icon: BarChart3, label: 'Analytics', to: '/workspace/projects/projectAnalytics' },
  { id: 'projectTeams', icon: Users2, label: 'Teams', to: '/workspace/projects/projectTeams' },
  { id: 'projectTasks', icon: ListChecks, label: 'Tasks', to: '/workspace/projects/projectTasks' },
  { id: 'projectCalendry', icon: CalendarDays, label: 'Calendar', to: '/workspace/projects/projectCalendry' },
];


export default function ProjectsSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`... ${collapsed ? 'w-20' : 'w-43'} bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 `}>
      <div className="px-3 py-3 ">
        <div className="flex items-center justify-between p-2">
          <ToggleButton onToggleSidebar={() => setCollapsed(!collapsed)} />
        </div>

        <nav className="mt-2 space-y-1">
          {tabs.map(({ id, icon: Icon, label, to }) => (
            <NavLink
              key={id}
              to={to}        // relative to /workspace/projects
              end
              className={({ isActive }) =>
                [
                  'group block rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50',
                ].join(' ')
              }
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center">
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="font-medium ml-2">{label}</span>}
                </div>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}