// src/components/ProjectTasks.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useAssignees,
  useTasks,
  useDeleteTasks,
  useUpdateTask,
  useCreateTask,
} from './userTasksHook';
import { useParams, NavLink } from 'react-router-dom';
import {
  type Assignee,
  type Task,
  type TaskFilters,
  friendlyAxiosError,
} from '../../../../api/tasks';
import { format } from 'date-fns';
import {
  Plus, Zap, CheckCircle2, Loader2, Users, ListChecks,
  CalendarDays, BarChart3, Settings
} from 'lucide-react';
import CreateTaskModal from './ProjectCreateTaskModal';

/** Filter value sets – must match your backend enums */
const TYPES = ['ALL', 'TASK', 'BUG', 'FEATURE'] as const;
const PRIORITIES = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const STATUSES = ['ALL', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const;

const initialFilters: TaskFilters = {
  search: '',
  type: 'ALL',
  priority: 'ALL',
  status: 'ALL',
  assigneeId: 'ALL',
  page: 1,
  pageSize: 10,
};

type Props = {
  projectId?: number;
  onCreated?: () => void;
};

/** ---------- UI helpers ---------- */
function Badge({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <span className={'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ' + className}>{children}</span>;
}
const Th: React.FC<React.PropsWithChildren> = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
    {children}
  </th>
);
const OutlineBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-800 dark:border-gray-700 dark:text-gray-200">
    {children}
  </span>
);
const PriorityPill: React.FC<{ priority: string }> = ({ priority }) => {
  const map: Record<string, string> = {
    LOW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    HIGH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
    CRITICAL: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  };
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${map[priority] ?? ''}`}>{priority}</span>;
};
const AssigneeCell: React.FC<{ assignee?: Assignee | null }> = ({ assignee }) => {
  if (!assignee) return <span className="text-gray-500">Unassigned</span>;
  const initials = assignee.name.split(' ').map(p => p[0]).slice(0, 2).join('');
  return (
    <div className="flex items-center gap-2">
      {assignee.avatarUrl ? (
        <img src={assignee.avatarUrl} alt={assignee.name} className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">{initials}</div>
      )}
      <span>{assignee.name}</span>
    </div>
  );
};
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2v3M16 2v3M3 10h18M4 7h16a1 1 0 0 1 1 1v12a 1 1 0 0 1 -1 1H4a1 1 0 0 1 -1-1V8a1 1 0 0 1 1-1z" />
  </svg>
);
const Pagination: React.FC<{ page: number; pageSize: number; total: number; onPageChange: (p: number) => void; }> = ({ page, pageSize, total, onPageChange }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-gray-700">Prev</button>
      <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-gray-700">Next</button>
    </div>
  );
};
function KpiCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode; }) {
  return (
    <div className="rounded-lg p-4 shadow-sm  bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 md:grid-cols-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</div>
        <div className="rounded-md bg-zinc-100 p-2 dark:bg-zinc-800">{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}
function TabLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; end?: boolean; }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition',
          isActive ? 'bg-blue-500 text-white dark:bg-zinc-100 dark:text-zinc-900'
                   : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
function TabButton({ label, icon: Icon, onClick }: { label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; onClick?: () => void; }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/** ---------- Pretty label helper ---------- */
function prettyEnumLabel(v: string) {
  return v.toLowerCase().split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

/** ---------- Inline controls (used only in edit mode) ---------- */
function InlineSelect({
  value, onChange, options, className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function InlineDate({
  value, onChange,
}: {
  value?: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
    />
  );
}

const DUMMY_PROJECT_ID = 2;

/** ---------- Types for edit session ---------- */
type Draft = {
  title?: string;
  type?: Task['type'];
  priority?: Task['priority'];
  status?: Task['status'];
  assigneeId?: number | null;
  dueDate?: string | null;
  version?: number;
};
type DraftsMap = Record<number, Draft>;
type OriginalsMap = Record<number, Task>;

/** ---------- Main Component ---------- */
export const ProjectTasks: React.FC<Props> = ({ projectId, onCreated }) => {
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  // Edit session state
  const [isEditing, setIsEditing] = useState(false);
  const [editableIds, setEditableIds] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<DraftsMap>({});
  const [originals, setOriginals] = useState<OriginalsMap>({});

  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const pid =
    projectId ??
    (routeProjectId ? Number(routeProjectId) : undefined) ??
    DUMMY_PROJECT_ID;

  if (!pid) {
    return <div className="p-4 text-sm text-rose-600">Missing project id (prop or route param).</div>;
  }

  const { data, isLoading, isError, error } = useTasks(pid, filters);
  const { data: assignees } = useAssignees(pid);
  const { mutateAsync: deleteTasks, isPending: deleting } = useDeleteTasks(pid, filters);
  const updateMutation = useUpdateTask(pid, filters);
  const createMutation = useCreateTask(pid, filters);

  const items: Task[] = data?.items ?? [];
  const total = data?.total ?? 0;

  const stats = useMemo(() => ({
    total,
    completed: items.filter((t) => t.status === 'DONE').length,
    inProgress: items.filter((t) => t.status === 'IN_PROGRESS').length,
    team: (assignees?.length ?? 0),
  }), [items, total, assignees]);

  // Clear selection when page changes or items change
  useEffect(() => {
    if (!isEditing) setSelected(new Set());
  }, [filters.page, filters.pageSize, items.map(i => i.id).join(','), isEditing]);

  // Header checkbox indeterminate state
  const allSelectedOnPage = items.length > 0 && items.every(i => selected.has(i.id));
  const someSelectedOnPage = items.some(i => selected.has(i.id)) && !allSelectedOnPage;
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = someSelectedOnPage;
  }, [someSelectedOnPage]);

  /** ---------- Selection ---------- */
  function toggleSelectAllPage() {
    if (isEditing) return; // lock selection during edit to avoid confusion
    const next = new Set(selected);
    if (allSelectedOnPage) items.forEach(i => next.delete(i.id));
    else items.forEach(i => next.add(i.id));
    setSelected(next);
  }
  function toggleRow(id: number) {
    if (isEditing) return; // lock selection during edit
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  /** ---------- Edit session controls ---------- */
  function startEdit() {
    if (selected.size === 0) return;
    const ids = new Set(selected);
    // Snapshot originals for the current page rows that are selected
    const origs: OriginalsMap = {};
    const ds: DraftsMap = {};
    items.forEach((t) => {
      if (ids.has(t.id)) {
        origs[t.id] = t;
        ds[t.id] = {
          title: t.title,
          type: t.type,
          priority: t.priority,
          status: t.status,
          assigneeId: t.assignee?.id ?? null,
          dueDate: t.dueDate ?? null,
          version: t.version,
        };
      }
    });
    setEditableIds(ids);
    setOriginals(origs);
    setDrafts(ds);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditableIds(new Set());
    setDrafts({});
    setOriginals({});
  }

  async function saveEdits() {
    // Compare drafts vs originals and patch only changed fields
    const changes: { task: Task; patch: Draft }[] = [];
    for (const id of editableIds) {
      const orig = originals[id];
      const draft = drafts[id];
      if (!orig || !draft) continue;

      const patch: Draft = { version: draft.version ?? orig.version };
      if (draft.title !== undefined && draft.title.trim() !== orig.title) patch.title = draft.title.trim();
      if (draft.type && draft.type !== orig.type) patch.type = draft.type;
      if (draft.priority && draft.priority !== orig.priority) patch.priority = draft.priority;
      if (draft.status && draft.status !== orig.status) patch.status = draft.status;
      const origAssigneeId = orig.assignee?.id ?? null;
      if (draft.assigneeId !== undefined && draft.assigneeId !== origAssigneeId) patch.assigneeId = draft.assigneeId;
      // Normalize '' to null
      const normalizedDue = draft.dueDate && draft.dueDate.length ? draft.dueDate : null;
      const origDue = orig.dueDate ?? null;
      if (normalizedDue !== origDue) patch.dueDate = normalizedDue;

      // Only queue if something changed besides version
      const keys = Object.keys(patch).filter(k => k !== 'version');
      if (keys.length > 0) changes.push({ task: orig, patch });
    }

    if (changes.length === 0) {
      cancelEdit();
      return;
    }

    // Persist sequentially (or Promise.allSettled). We'll do allSettled and report failures.
    const results = await Promise.allSettled(
      changes.map(({ task, patch }) =>
        updateMutation.mutateAsync({ taskId: task.id, patch })
      )
    );

    const failures = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.status === 'rejected')
      .map(({ i, r }) => ({ id: changes[i].task.id, error: (r as PromiseRejectedResult).reason }));

    if (failures.length > 0) {
      const msg = failures
        .map(f => `Task #${f.id}: ${friendlyAxiosError(f.error)}`)
        .join('\n');
      alert(`Some updates failed:\n${msg}`);
    }

    // Exit edit mode; invalidate is already handled by hook's onSettled
    cancelEdit();
  }

  /** ---------- Delete ---------- */
  async function handleDeleteSelected() {
    if (selected.size === 0 || isEditing) return;
    const confirmed = window.confirm(`Delete ${selected.size} selected task(s)? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteTasks(Array.from(selected));
      setSelected(new Set());
    } catch (e) {
      alert(`Delete failed: ${(e as Error).message}`);
    }
  }

  /** ---------- Debounced search ---------- */
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  function setFilter<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  }
  function onPageChange(nextPage: number) {
    setFilters(f => ({ ...f, page: nextPage }));
  }

  /** ---------- Create modal ---------- */
  const [createOpen2, setCreateOpenLocal] = useState(false);
  function openCreate() { setCreateOpenLocal(true); }
  function closeCreate() { setCreateOpenLocal(false); }
  async function handleCreateTaskSubmit(apiPayload: Parameters<typeof createMutation.mutateAsync>[0]) {
    try {
      await createMutation.mutateAsync(apiPayload);
      closeCreate();
      onCreated?.();
    } catch (e) {
      alert(friendlyAxiosError(e) || 'Failed to create task');
    }
  }

  // Assignee options for editing
  const assigneeOptions = useMemo(() => (assignees ?? []).map(a => ({ value: String(a.id), label: a.name })), [assignees]);

  return (
    <div className="space-y-4 ">
      {/* Header + New Task */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center ">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Project Tasks</h2>
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">ACTIVE</Badge>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ">
        <KpiCard title="Total Tasks" value={stats.total} icon={<Zap className="h-5 w-5 text-blue-600" />} />
        <KpiCard title="Completed" value={stats.completed} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
        <KpiCard title="In Progress" value={stats.inProgress} icon={<Loader2 className="h-5 w-5 text-amber-600" />} />
        <KpiCard title="Team Members" value={stats.team} icon={<Users className="h-5 w-5 text-indigo-600" />} />
      </section>

      {/* Tabs – relative links keep :projectId */}
      <nav className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:bg-slate-900/80">
        <TabLink to="." end icon={ListChecks} label="Tasks" />
        <TabLink to="calendar" icon={CalendarDays} label="Calendar" />
        <TabLink to="analytics" icon={BarChart3} label="Analytics" />
        <TabButton icon={Settings} label="Settings" />
      </nav>

      {/* Toolbar: Edit/Delete appear when selection; Save/Cancel when editing */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <div className="flex items-center gap-2">
          {!isEditing && selected.size > 0 && (
            <>
              <button
                onClick={startEdit}
                className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-transparent"
                title="Edit selected"
              >
                Edit ({selected.size})
              </button>
              <button
                onClick={handleDeleteSelected}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
                title="Delete selected"
              >
                Delete ({selected.size})
              </button>
            </>
          )}

          {isEditing && (
            <>
              <button
                onClick={saveEdits}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                title="Save changes"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-200"
                title="Cancel editing"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-md md:grid-cols-8">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-gray-300">Search</label>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Title, description…"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <SelectInline
          label="Type"
          value={(filters.type as string) ?? 'ALL'}
          onChange={v => setFilter('type', v as any)}
          options={TYPES.map(v => ({ value: v, label: prettyEnumLabel(v) }))}
        />
        <SelectInline
          label="Priority"
          value={(filters.priority as string) ?? 'ALL'}
          onChange={v => setFilter('priority', v as any)}
          options={PRIORITIES.map(v => ({ value: v, label: prettyEnumLabel(v) }))}
        />
        <SelectInline
          label="Status"
          value={(filters.status as string) ?? 'ALL'}
          onChange={v => setFilter('status', v as any)}
          options={STATUSES.map(v => ({ value: v, label: prettyEnumLabel(v) }))}
        />
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300">Assignee</label>
          <select
            value={(filters.assigneeId as any) ?? 'ALL'}
            onChange={e => setFilter('assigneeId', (e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)) as any)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="ALL">All</option>
            {(assignees ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-gray-600 dark:text-gray-300">Due From</label>
          <input
            type="date"
            value={filters.dueFrom ?? ''}
            onChange={e => setFilter('dueFrom', e.target.value || undefined)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm text-gray-600 dark:text-gray-300">Due To</label>
          <input
            type="date"
            value={filters.dueTo ?? ''}
            onChange={e => setFilter('dueTo', e.target.value || undefined)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                  checked={allSelectedOnPage}
                  onChange={toggleSelectAllPage}
                />
              </th>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th>Assignee</Th>
              <Th>Due Date</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (<tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>)}
            {isError && !isLoading && (<tr><td colSpan={7} className="px-4 py-6 text-center text-rose-600">{error?.message}</td></tr>)}
            {!isLoading && !isError && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No tasks match your filters.</td></tr>
            )}

            {items.map((t) => {
              const isRowEditable = isEditing && editableIds.has(t.id);
              const d = drafts[t.id] ?? {};
              const assigneeValue = d.assigneeId ?? t.assignee?.id ?? null;
              const dueValue = d.dueDate ?? t.dueDate ?? null;

              return (
                <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50">
                  {/* Select checkbox (locked during edit) */}
                  <td className="px-3 py-2 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                      checked={selected.has(t.id)}
                      onChange={() => toggleRow(t.id)}
                      disabled={isEditing}
                    />
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 align-middle">
                    {!isRowEditable ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{t.title}</span>
                      </div>
                    ) : (
                      <input
                        value={d.title ?? t.title}
                        onChange={(e) => setDrafts(s => ({ ...s, [t.id]: { ...s[t.id], title: e.target.value, version: t.version } }))}
                        className="w-full rounded-md border border-blue-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      />
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 align-middle">
                    {!isRowEditable ? (
                      <OutlineBadge>{prettyEnumLabel(t.type)}</OutlineBadge>
                    ) : (
                      <InlineSelect
                        value={d.type ?? t.type}
                        onChange={(v) => setDrafts(s => ({ ...s, [t.id]: { ...s[t.id], type: v as Task['type'], version: t.version } }))}
                        options={[
                          { value: 'TASK', label: 'Task' },
                          { value: 'FEATURE', label: 'Feature' },
                          { value: 'BUG', label: 'Bug' },
                        ]}
                      />
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3 align-middle">
                    {!isRowEditable ? (
                      <PriorityPill priority={t.priority} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <InlineSelect
                          value={d.priority ?? t.priority}
                          onChange={(v) => setDrafts(s => ({ ...s, [t.id]: { ...s[t.id], priority: v as Task['priority'], version: t.version } }))}
                          options={[
                            { value: 'LOW', label: 'Low' },
                            { value: 'MEDIUM', label: 'Medium' },
                            { value: 'HIGH', label: 'High' },
                            { value: 'CRITICAL', label: 'Critical' },
                          ]}
                        />
                        <PriorityPill priority={d.priority ?? t.priority ?? 'LOW'} />
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 align-middle">
                    {!isRowEditable ? (
                      <span className="text-gray-800 dark:text-gray-200">{prettyEnumLabel(t.status)}</span>
                    ) : (
                      <InlineSelect
                        value={d.status ?? t.status}
                        onChange={(v) => setDrafts(s => ({ ...s, [t.id]: { ...s[t.id], status: v as Task['status'], version: t.version } }))}
                        options={[
                          { value: 'TODO', label: 'To Do' },
                          { value: 'IN_PROGRESS', label: 'In Progress' },
                          { value: 'BLOCKED', label: 'Blocked' },
                          { value: 'DONE', label: 'Done' },
                        ]}
                      />
                    )}
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3 align-middle">
                    {!isRowEditable ? (
                      <AssigneeCell assignee={t.assignee} />
                    ) : (
                      <InlineSelect
                        value={assigneeValue != null ? String(assigneeValue) : 'Unassigned'}
                        onChange={(v) => {
                          const next = v === 'Unassigned' ? null : Number(v);
                          setDrafts(s => ({ ...s, [t.id]: { ...s[t.id], assigneeId: next, version: t.version } }));
                        }}
                        options={[
                          { value: 'Unassigned', label: 'Unassigned' },
                          ...assigneeOptions,
                        ]}
                      />
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="px-4 py-3 align-middle">
                    {!isRowEditable ? (
                      <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <CalendarIcon />
                        {t.dueDate ? format(new Date(t.dueDate), 'd MMMM') : '—'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <InlineDate
                          value={dueValue}
                          onChange={(v) => setDrafts(s => ({ ...s, [t.id]: { ...s[t.id], dueDate: v, version: t.version } }))}
                        />
                        <span className="hidden sm:inline">
                          {dueValue ? format(new Date(dueValue), 'd MMMM') : '—'}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={filters.page ?? 1} pageSize={filters.pageSize ?? 10} total={total} onPageChange={onPageChange} />

      {/* Create Task Modal (API-ready) */}
      <CreateTaskModal
        open={createOpen2}
        onClose={closeCreate}
        onSubmit={handleCreateTaskSubmit}
        assignees={(assignees ?? []).map(a => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
};

/** Small helper used by Filters (matches your SelectBox UX) */
function SelectInline({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}