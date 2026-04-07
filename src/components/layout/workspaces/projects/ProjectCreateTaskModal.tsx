import * as React from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

/** --------- Types --------- */

export type CreateTaskApiPayload = {
  title: string;
  description?: string | null;
  type: 'TASK' | 'FEATURE' | 'BUG';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  assigneeId?: number | null;
  dueDate?: string | null; // yyyy-mm-dd or null
};

type AssigneeOption = { id: number; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Expects API-ready payload */
  onSubmit: (apiPayload: CreateTaskApiPayload) => Promise<void> | void;
  /** [{ id, name }] */
  assignees?: AssigneeOption[];
  /** Prefill values (e.g., if reusing modal for “Edit”) */
  defaultValues?: Partial<CreateTaskApiPayload>;
};

/** --------- Pretty labels for enums (display only) --------- */

function prettyEnumLabel(v: string) {
  return v
    .toLowerCase()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

/** --------- Defaults --------- */

const defaultForm: CreateTaskApiPayload = {
  title: '',
  description: '',
  type: 'TASK',
  priority: 'MEDIUM',
  status: 'TODO',
  assigneeId: null,
  dueDate: '',
};

/** --------- Component --------- */

export default function CreateTaskModal({
  open,
  onClose,
  onSubmit,
  assignees = [],
  defaultValues,
}: Props) {
  const [form, setForm] = React.useState<CreateTaskApiPayload>({
    ...defaultForm,
    ...defaultValues,
  });

  const [submitting, setSubmitting] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Reset when opened
  React.useEffect(() => {
    if (open) setForm({ ...defaultForm, ...defaultValues });
  }, [open, defaultValues]);

  // Close on ESC
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open && !submitting) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  // Focus dialog when opened
  React.useEffect(() => {
    if (open && dialogRef.current) dialogRef.current.focus();
  }, [open]);

  if (!open) return null;

  /** ------- Handlers ------- */

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const setField =
    <K extends keyof CreateTaskApiPayload>(key: K) =>
    (value: CreateTaskApiPayload[K]) =>
      setForm((s) => ({ ...s, [key]: value }));

  const handleChange =
    <K extends keyof CreateTaskApiPayload>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      let val: any = e.target.value;
      if (key === 'assigneeId') {
        // 'Unassigned' -> null; else cast to number
        val = val === 'Unassigned' ? null : Number(val);
      }
      setForm((s) => ({ ...s, [key]: val }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }

    const payload: CreateTaskApiPayload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      type: form.type,
      priority: form.priority,
      status: form.status,
      assigneeId: form.assigneeId ?? null,
      dueDate: form.dueDate && form.dueDate.length ? form.dueDate : null,
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  /** ------- Render ------- */

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm"
      onMouseDown={handleOverlayClick}
      aria-labelledby="create-task-title"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl outline-none dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h3 id="create-task-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Create New Task
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={handleChange('title')}
              placeholder="Android App Development"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
            <textarea
              rows={4}
              value={form.description ?? ''}
              onChange={handleChange('description')}
              placeholder="Describe the task"
              className="w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Row: Type / Priority */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Type */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</label>
              <select
                value={form.type}
                onChange={handleChange('type')}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {(['TASK', 'FEATURE', 'BUG'] as const).map((opt) => (
                  <option key={opt} value={opt}>
                    {prettyEnumLabel(opt)}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
              <select
                value={form.priority}
                onChange={handleChange('priority')}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((opt) => (
                  <option key={opt} value={opt}>
                    {prettyEnumLabel(opt)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Assignee / Status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Assignee */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Assignee</label>
              <select
                value={form.assigneeId == null ? 'Unassigned' : String(form.assigneeId)}
                onChange={handleChange('assigneeId')}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="Unassigned">Unassigned</option>
                {(assignees ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
              <select
                value={form.status}
                onChange={handleChange('status')}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const).map((opt) => (
                  <option key={opt} value={opt}>
                    {prettyEnumLabel(opt)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Due Date</label>
            <div className="relative">
              <input
                type="date"
                value={form.dueDate ?? ''}
                onChange={handleChange('dueDate')}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="yyyy-mm-dd"
              />
              <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}