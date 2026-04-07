import { useMemo } from 'react';
import {
  FolderClosed, CheckCircle2, UserRound, AlertTriangle,
  Users2, CalendarDays, MoreHorizontal, Plus, ChevronRight,
  Tag, Clock
} from 'lucide-react';


type Stat = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
};

type ProjectItem = {
  id: number;
  name: string;
  description: string;
  members: number;
  due: string; // ISO or human
  status: 'ACTIVE' | 'PAUSED' | 'DONE';
  progress: number; // 0-100
};

type TaskItem = {
  id: number;
  title: string;
  kind: 'TASK' | 'FEATURE' | 'IMPROVEMENT' | 'BUG';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

export default function ProjectAnalytics() {

  // ---- TEMP: mock data (swap with your API hooks later)
  const stats = useMemo<Stat[]>(
    () => [
      {
        title: 'Total Projects',
        value: 2,
        subtitle: 'projects in Zomato Inc',
        icon: <FolderClosed className="h-5 w-5 text-blue-600" />,
      },
      {
        title: 'Completed Projects',
        value: 0,
        subtitle: 'of 2 total',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      },
      {
        title: 'My Tasks',
        value: 3,
        subtitle: 'assigned to me',
        icon: <UserRound className="h-5 w-5 text-purple-600" />,
      },
      {
        title: 'Overdue',
        value: 0,
        subtitle: 'need attention',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      },
    ],
    []
  );

  const projects = useMemo<ProjectItem[]>(
    () => [
      {
        id: 10,
        name: 'Delivery Partner App',
        description: 'Building Delivery App for iOS and Android',
        members: 11,
        due: 'Oct 31, 2025',
        status: 'ACTIVE',
        progress: 0,
      },
      {
        id: 11,
        name: 'Customer App Development',
        description: 'Building Customer Order App for iOS and Android',
        members: 11,
        due: 'Oct 31, 2025',
        status: 'ACTIVE',
        progress: 0,
      },
    ],
    []
  );

  const myTasks = useMemo<TaskItem[]>(
    () => [
      { id: 1, title: 'UI / UX Design', kind: 'TASK', priority: 'MEDIUM' },
      { id: 2, title: 'Android App Development', kind: 'FEATURE', priority: 'HIGH' },
      { id: 3, title: 'iOS App Development', kind: 'IMPROVEMENT', priority: 'MEDIUM' },
    ],
    []
  );

  const overdue = useMemo<TaskItem[]>(
    () => [
      // Example: leave empty to show "0" like your screenshot,
      // or put overdue items here.
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Top Row: Welcome + New Project */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Here’s what’s happening with your projects today
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.title}
            className="rbg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-zinc-100 p-2 dark:bg-zinc-800">
                  {s.icon}
                </div>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {s.title}
                </div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {s.value}
            </div>
            {s.subtitle && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {s.subtitle}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Project Overview */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Project Overview
            </h3>
            <button className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {p.name}
                    </h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {p.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Users2 className="h-4 w-4" />
                        {p.members} members
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {p.due}
                      </span>
                    </div>
                  </div>

                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold',
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : p.status === 'DONE'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                    ].join(' ')}
                  >
                    {p.status}
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Progress</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sidebar with My Tasks + Overdue */}
        <div className="space-y-6">
          {/* My Tasks */}
          <CardWithList
            title="My Tasks"
            count={myTasks.length}
            items={myTasks.map((t) => ({
              id: t.id,
              title: t.title,
              metaLeft: `${t.kind}`,
              metaRight: `${t.priority} Priority`,
              metaLeftIcon: <Tag className="h-3.5 w-3.5" />,
            }))}
          />

          {/* Overdue */}
          <CardWithList
            title="Overdue"
            count={overdue.length}
            items={overdue.map((t) => ({
              id: t.id,
              title: t.title,
              metaLeft: `${t.kind}`,
              metaRight: `${t.priority} Priority`,
              metaLeftIcon: <Clock className="h-3.5 w-3.5" />,
            }))}
            emptyHint="You're all caught up! 🎉"
          />
        </div>
      </section>
    </div>
  );
}

/** Reusable right-side list card */
function CardWithList({
  title,
  count,
  items,
  emptyHint,
}: {
  title: string;
  count: number;
  items: Array<{
    id: number | string;
    title: string;
    metaLeft?: string;
    metaRight?: string;
    metaLeftIcon?: React.ReactNode;
  }>;
  emptyHint?: string;
}) {
  return (
    <div className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </div>
        <div className="flex h-6 min-w-6 items-center justify-center rounded-md bg-zinc-100 px-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {count}
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {emptyHint ?? 'No items'}
          </p>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className="rounded-md border border-zinc-100 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
            >
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {it.title}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  {it.metaLeftIcon}
                  {it.metaLeft}
                </span>
                <span className="font-medium">{it.metaRight}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}