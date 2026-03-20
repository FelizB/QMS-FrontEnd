// src/features/users/UsersModal.tsx// src/features/users/UsersModal 

import * as React from 'react';
import clsx from 'clsx';
import { type UserUpdate,type UserCreate } from '../../../generated/sdk/models';

type Mode = 'create' | 'edit';
type UserFormState = Partial<UserCreate> & Partial<UserUpdate>;

type UsersModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  title?: string;
  onClose: () => void;
  initial?: UserFormState;                 // <-- changed
  onSubmit: (payload: UserCreate | UserUpdate) => Promise<void> | void;
  onlyChanges?: boolean;
  submitting?: boolean;
};


// ---------- Helpers ----------
function trimOrNull(v?: string | null): string | null | undefined {
  if (v === undefined) return undefined;
  const t = String(v).trim();
  return t.length ? t : null;
}

function parseSkills(input: string | undefined): string[] | null | undefined {
  if (input === undefined) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.split(',').map(s => s.trim()).filter(Boolean);
}

function parseJsonOrNull(input?: string): any | null | undefined {
  if (input === undefined) return undefined;
  const t = input.trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return '__JSON_ERROR__';
  }
}

const defaultCreate: UserCreate = {
  username: '',
  email: '',
  department: '',
  role: '',
  unit: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: null,
  birthday: null,
  rss_token: null,
  admin: false,
  superuser: false,
  phone: '',
  site: '',
  address: '',
  country: '',
  primary_worksite_info: undefined,
  secondary_worksite_info: undefined,
  password: '',
};

export function UserModal({
  open,
  mode,
  title,
  onClose,
  initial,
  onSubmit,
  onlyChanges = true,
  submitting = false,
}: UsersModalProps) {
  // Build the baseline

  const baseline = React.useMemo<UserFormState>(() => {
    if (mode === 'create') {
      return { ...defaultCreate, ...(initial ?? {}) } as UserFormState;
    }
    return { ...(initial ?? {}) } as UserFormState;
  }, [mode, initial]);

  // Local editable form state (string-ified where convenient)
  const [form, setForm] = React.useState<UserFormState>(() => baseline);

  // Additional string fields for JSON textareas & skills text
  const [skillsText, setSkillsText] = React.useState<string>('');
  const [primaryWsText, setPrimaryWsText] = React.useState<string>('');
  const [secondaryWsText, setSecondaryWsText] = React.useState<string>('');

  // Initialize from baseline whenever it changes
  React.useEffect(() => {
    setForm(baseline);
    // Skills
    const sk = (baseline as UserUpdate)?.skills;
    setSkillsText(Array.isArray(sk) ? sk.join(', ') : '');
    // Worksites
    setPrimaryWsText(
      (baseline as any)?.primary_worksite_info
        ? JSON.stringify((baseline as any).primary_worksite_info, null, 2)
        : ''
    );
    setSecondaryWsText(
      (baseline as any)?.secondary_worksite_info
        ? JSON.stringify((baseline as any).secondary_worksite_info, null, 2)
        : ''
    );
  }, [baseline]);


  const set = <K extends keyof (UserCreate & UserUpdate)>(key: K, val: (UserCreate & UserUpdate)[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // 4) (Optional) When building submit payload, you can normalize:
  //    - inputs often produce '' → convert to null if your API expects null
  function trimOrNull(v?: string | null): string | null | undefined {
    if (v === undefined) return undefined;
    const t = String(v).trim();
    return t.length ? t : null;
  }

  // Validation (Create)
  const createValid =
    mode === 'create'
      ? (form.username?.trim().length ?? 0) >= 3 &&
        (form.email?.trim().length ?? 0) > 0 &&
        (form.department?.trim().length ?? 0) > 0 &&
        (form.role?.trim().length ?? 0) > 0 &&
        (form.unit?.trim().length ?? 0) > 0 &&
        (form.first_name?.trim().length ?? 0) > 0 &&
        (form.last_name?.trim().length ?? 0) > 0 &&
        (form.password?.length ?? 0) >= 8
      : true;

  // Dirty check (Edit)
  const isEditDirty = React.useMemo(() => {
    if (mode !== 'edit') return false;
    const keys = new Set([
      'username','email','department','unit','admin','active','approved','locked',
      'first_name','middle_name','last_name','gender','birthday','phone','site','address','country',
      'rss_token','skills','primary_worksite_info','secondary_worksite_info',
      // You can add more if you expose more fields in the UI
    ] as (keyof (UserCreate & UserUpdate))[]);

    // Build a normalized snapshot of current form for fields we compare
    const current: Record<string, any> = {};
    keys.forEach(k => (current[k as string] = (form as any)[k]));

    // Normalize skills from text
    current['skills'] = parseSkills(skillsText);

    // Normalize worksites from textarea (leave as string here; we'll parse on submit)
    // For dirty, just compare the strings
    const basePrimaryStr = (baseline as any)?.primary_worksite_info
      ? JSON.stringify((baseline as any).primary_worksite_info)
      : '';
    const baseSecondaryStr = (baseline as any)?.secondary_worksite_info
      ? JSON.stringify((baseline as any).secondary_worksite_info)
      : '';

    const curPrimaryStr = primaryWsText.trim();
    const curSecondaryStr = secondaryWsText.trim();

    // Compare primitive fields
    for (const k of Object.keys(current)) {
      if (k === 'primary_worksite_info' || k === 'secondary_worksite_info') continue;
      const a = current[k];
      const b = (baseline as any)[k];
      // arrays/objects: shallow compare stringified for simplicity
      const eq = typeof a === 'object' ? JSON.stringify(a) === JSON.stringify(b) : a === b;
      if (!eq) return true;
    }
    // Compare worksites as strings
    if (curPrimaryStr !== basePrimaryStr) return true;
    if (curSecondaryStr !== baseSecondaryStr) return true;

    return false;
  }, [mode, form, baseline, skillsText, primaryWsText, secondaryWsText]);

  const disabledSubmit = mode === 'create' ? !createValid || submitting : !isEditDirty || submitting;

  // Submit handler
  const handleSubmit = async () => {
    // Build payload
    const payload: any = { ...form };

    // Normalize empties
    payload.middle_name = trimOrNull(payload.middle_name);
    payload.gender = trimOrNull(payload.gender);
    payload.birthday = trimOrNull(payload.birthday); // Expect 'YYYY-MM-DD' or null
    payload.rss_token = trimOrNull(payload.rss_token);
    payload.phone = trimOrNull(payload.phone);
    payload.site = trimOrNull(payload.site);
    payload.address = trimOrNull(payload.address);
    payload.country = trimOrNull(payload.country);

    // Skills
    const skills = parseSkills(skillsText);
    if (skills !== undefined) payload.skills = skills;

    // Worksites
    const pws = parseJsonOrNull(primaryWsText);
    const sws = parseJsonOrNull(secondaryWsText);
    if (pws === '__JSON_ERROR__' || sws === '__JSON_ERROR__') {
      alert('Worksite info must be valid JSON (or leave blank).');
      return;
    }
    if (pws !== undefined) payload.primary_worksite_info = pws;
    if (sws !== undefined) payload.secondary_worksite_info = sws;

    if (mode === 'edit' && onlyChanges) {
      // Compress to only changed fields vs baseline
      const out: Record<string, any> = {};
      const allKeys = new Set([...Object.keys(payload), ...Object.keys(baseline)]);
      for (const k of allKeys) {
        const a = payload[k];
        const b = (baseline as any)[k];
        const same = typeof a === 'object' ? JSON.stringify(a) === JSON.stringify(b) : a === b;
        if (!same) out[k] = a;
      }
      await onSubmit(out as UserUpdate);
      return;
    }

    await onSubmit(payload as any);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/60 dark:border-slate-700/60 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title ?? (mode === 'create' ? 'Create User' : 'Edit User')}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto text-slate-700 dark:text-slate-300">
            {/* Identity */}
            <section>
              <h4 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">Identity</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Username" required>
                  <input
                    className="tw-input"
                    value={form.username ?? ''}
                    onChange={(e) => set('username', e.target.value)}
                    placeholder="jdoe"
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    className="tw-input"
                    type="email"
                    maxLength={100}
                    value={form.email ?? ''}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </Field>
                <Field label="First Name" required>
                  <input
                    className="tw-input"
                    value={form.first_name ?? ''}
                    onChange={(e) => set('first_name', e.target.value)}
                  />
                </Field>
                <Field label="Middle Name">
                  <input
                    className="tw-input"
                    value={form.middle_name ?? ''}
                    onChange={(e) => set('middle_name', e.target.value)}
                  />
                </Field>
                <Field label="Last Name" required>
                  <input
                    className="tw-input"
                    value={form.last_name ?? ''}
                    onChange={(e) => set('last_name', e.target.value)}
                  />
                </Field>

                <Field label="Gender">
                  <select
                    className="tw-input"
                    value={form.gender ?? ''}
                    onChange={(e) => set('gender', e.target.value || null)}
                  >
                    <option value="">-- Select --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </Field>

                <Field label="Birthday">
                  <input
                    className="tw-input"
                    type="date"
                    value={form.birthday ?? ''}
                    onChange={(e) => set('birthday', e.target.value || null)}
                  />
                </Field>
              </div>
            </section>

            {/* Organization */}
            <section>
              <h4 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">Organization</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Department" required={mode === 'create'}>
                  <input
                    className="tw-input"
                    value={form.department ?? ''}
                    onChange={(e) => set('department', e.target.value)}
                  />
                </Field>
                <Field label="Unit" required={mode === 'create'}>
                  <input
                    className="tw-input"
                    value={form.unit ?? ''}
                    onChange={(e) => set('unit', e.target.value)}
                  />
                </Field>
                {mode === 'create' && (
                  <Field label="Role" required>
                    <input
                      className="tw-input"
                      value={(form as UserCreate).role ?? ''}
                      onChange={(e) => set('role' as any, e.target.value)}
                    />
                  </Field>
                )}
                <Field label="Site">
                  <input
                    className="tw-input"
                    value={form.site ?? ''}
                    onChange={(e) => set('site', e.target.value)}
                  />
                </Field>
                <Field label="Address">
                  <input
                    className="tw-input"
                    value={form.address ?? ''}
                    onChange={(e) => set('address', e.target.value)}
                  />
                </Field>
                <Field label="Country">
                  <input
                    className="tw-input"
                    value={form.country ?? ''}
                    onChange={(e) => set('country', e.target.value)}
                  />
                </Field>
              </div>
            </section>

            {/* Contact & Security */}
            <section>
              <h4 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">Contact & Security</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Phone">
                  <input
                    className="tw-input"
                    value={form.phone ?? ''}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </Field>

                {mode === 'create' && (
                  <Field label="Password" required>
                    <input
                      className="tw-input"
                      type="password"
                      value={(form as UserCreate).password ?? ''}
                      onChange={(e) => set('password' as any, e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </Field>
                )}

                <Field label="RSS Token">
                  <input
                    className="tw-input"
                    value={form.rss_token ?? ''}
                    onChange={(e) => set('rss_token', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <Toggle label="Admin" checked={!!form.admin} onChange={(v) => set('admin', v)} />
                {mode === 'create' && (
                  <Toggle label="Superuser" checked={!!(form as UserCreate).superuser} onChange={(v) => set('superuser' as any, v)} />
                )}
                {mode === 'edit' && (
                  <>
                    <Toggle label="Active" checked={!!(form as UserUpdate).active} onChange={(v) => set('active' as any, v)} />
                    <Toggle label="Approved" checked={!!(form as UserUpdate).approved} onChange={(v) => set('approved' as any, v)} />
                    <Toggle label="Locked" checked={!!(form as UserUpdate).locked} onChange={(v) => set('locked' as any, v)} />
                  </>
                )}
              </div>
            </section>

            {/* Skills & Worksites */}
            <section>
              <h4 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">Skills & Worksites</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Skills (comma separated)">
                  <input
                    className="tw-input"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="java, python, qa"
                  />
                </Field>
                <div className="hidden md:block" />
                <Field label="Primary Worksite (JSON)">
                  <textarea
                    className="tw-textarea min-h-28"
                    value={primaryWsText}
                    onChange={(e) => setPrimaryWsText(e.target.value)}
                    placeholder='e.g. { "siteCode": "NBI01", "location": "Nairobi" }'
                  />
                </Field>
                <Field label="Secondary Worksite (JSON)">
                  <textarea
                    className="tw-textarea min-h-28"
                    value={secondaryWsText}
                    onChange={(e) => setSecondaryWsText(e.target.value)}
                  />
                </Field>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabledSubmit}
              className={clsx(
                'px-4 py-2 rounded-lg text-white',
                disabledSubmit
                  ? 'bg-blue-400/60 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {mode === 'create' ? 'Create User' : 'Update User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Local UI bits ----------

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}

/* Tailwind utility presets for inputs (optional, or replace with your own)
 Add these to your global CSS if you prefer (or keep here as className strings)
*/
declare global {
  interface HTMLElementTagNameMap {
    // no-op; just to keep TS quiet about custom classes
  }
}

// You can move these to a CSS file if preferred:
const baseInput =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/60';
const baseTextarea =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/60';

const style = document?.createElement?.('style');
if (style) {
  style.innerHTML = `
    .tw-input { ${toCssVars(baseInput)} }
    .tw-textarea { ${toCssVars(baseTextarea)} }
  `;
  document.head.appendChild(style);
}

function toCssVars(cls: string) {
  // This is just to keep the snippet self-contained.
  // In your codebase, put classes directly in className.
  return '';
}
