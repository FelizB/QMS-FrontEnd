import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams} from 'react-router-dom';
import type { UserUpdate } from '../../../generated/sdk/models';
import { useUserMutations } from './useUserMutations';

/** Row shape from UsersTable */
export interface User {
  id: number;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  username: string;
  isAdmin: boolean;
  email: string;
  department?: string;
  unit?: string;
  userNumber: string;
  externalLogin: boolean;
  twoFactorEnabled: boolean;
  active: boolean;
}

/** Final edit form state */
type UserFormState = Partial<UserUpdate>;

/** Convert table camelCase → correct update shape */
function tableUserToUpdateBaseline(u: User): UserUpdate {
  return {
    username: u.username,
    email: u.email,
    department: u.department ?? null,
    unit: u.unit ?? null,
    active: u.active,
    approved: null,
    locked: null,
    admin: u.isAdmin,
    gender: null,
    birthday: null,
    first_name: u.firstName,
    middle_name: u.middleInitial ?? null,
    last_name: u.lastName,
    rss_token: null,
    phone: null,
    site: null,
    address: null,
    country: null,
    skills: null,
    primary_worksite_info: null,
    secondary_worksite_info: null,
  };
}

export default function UserEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number(params.id);

  const location = useLocation() as {
    state?: {
      initialUser?: User;
      initialUpdateBaseline?: Partial<UserUpdate>;
    };
  };

  const { updateUserAsync, deleteUserAsync } = useUserMutations();

  /** STEP 1 — Build baseline from navigation state OR props OR empty */
  const baseline: UserFormState = useMemo(() => {
    // PRIORITY 1 — baseline passed from UsersTable
    if (location.state?.initialUpdateBaseline) {
      return { ...location.state.initialUpdateBaseline };
    }

    if (location.state?.initialUser) {
      return tableUserToUpdateBaseline(location.state.initialUser);
    }

    // PRIORITY 2 — fallback to empty (refresh case)
    return {};
  }, [location.state]);

  /** STEP 2 — Local editable form */
  const [form, setForm] = useState<UserFormState>({});
  const [skillsText, setSkillsText] = useState('');
  const [primaryWsText, setPrimaryWsText] = useState('');
  const [secondaryWsText, setSecondaryWsText] = useState('');

  /** STEP 3 — Seed form when baseline changes */
  useEffect(() => {
    setForm(baseline);

    setSkillsText(
      Array.isArray(baseline.skills)
        ? baseline.skills.join(', ')
        : ''
    );

    setPrimaryWsText(
      baseline.primary_worksite_info
        ? JSON.stringify(baseline.primary_worksite_info, null, 2)
        : ''
    );

    setSecondaryWsText(
      baseline.secondary_worksite_info
        ? JSON.stringify(baseline.secondary_worksite_info, null, 2)
        : ''
    );
  }, [baseline]);

  /** simple setter */
  const update = (key: keyof UserFormState, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  /** STEP 4 — Build normalized "current" payload */
  const normalizeEmpty = (v: any) => {
    if (typeof v === 'string') return v.trim() || null;
    return v;
  };

  const parseJson = (txt: string) => {
    const trim = txt.trim();
    if (!trim) return null;
    try {
      return JSON.parse(trim);
    } catch {
      return '__ERROR__';
    }
  };

  const parseSkills = (txt: string) =>
    txt.trim()
      ? txt.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

  const currentNormalized = useMemo(() => {
    const cur = { ...form };

    // normalize simple blanks
    const blankables: (keyof UserFormState)[] = [
      'middle_name', 'rss_token',
      'phone', 'site', 'address', 'country',
      'department', 'unit'
    ];

    blankables.forEach((k) => {
      cur[k] = normalizeEmpty(cur[k]) as any;
    });

    // skills
    cur.skills = parseSkills(skillsText);

    // JSON worksites
    cur.primary_worksite_info = parseJson(primaryWsText);
    cur.secondary_worksite_info = parseJson(secondaryWsText);

    return cur;
  }, [form, skillsText, primaryWsText, secondaryWsText]);

  /** STEP 5 — Dirty check */
  const isDirty = useMemo(() => {
    const keys: (keyof UserFormState)[] = [
      'username','email','department','unit','admin','active','approved','locked',
      'first_name','middle_name','last_name','rss_token',
      'phone','site','address','country','skills','primary_worksite_info','secondary_worksite_info'
    ];

    return keys.some((k) => {
      const a = currentNormalized[k];
      const b = baseline[k];
      const equal =
        typeof a === 'object'
          ? JSON.stringify(a) === JSON.stringify(b)
          : a === b;
      return !equal;
    });
  }, [currentNormalized, baseline]);

  /** STEP 6 — Submit */
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!id) return;

    // validate JSON
    if (
      (currentNormalized.primary_worksite_info as any) === '__ERROR__' ||
      (currentNormalized.secondary_worksite_info as any) === '__ERROR__'
    ) {
      alert('Invalid JSON in worksite fields.');
      return;
    }

    // compute PATCH diff
    const patch: any = {};
    const keys = Object.keys(currentNormalized) as (keyof UserFormState)[];

    keys.forEach((k) => {
      const a = currentNormalized[k];
      const b = baseline[k];

      const equal =
        typeof a === 'object'
          ? JSON.stringify(a) === JSON.stringify(b)
          : a === b;

      if (!equal) patch[k] = a;
    });

    try {
      setSubmitting(true);
      await updateUserAsync({ id, patch });
      alert('User updated.');
      navigate(-1);
    } finally {
      setSubmitting(false);
    }
  };

  /** STEP 7 — Delete */
  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Delete this user?')) return;
    try {
      setSubmitting(true);
      await deleteUserAsync(id);
      alert('Deleted.');
      navigate(-1);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------
  // UI Rendering
  // ---------------------------------------------------------------------
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-slate-50 dark:bg-slate-900 py-10 px-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">

        {/* HEADER */}
        <div className="border-b px-6 py-4 flex items-center justify-between dark:border-slate-700">
          <h1 className="text-xl font-semibold dark:text-slate-100 text-slate-900">
            Edit User
          </h1>

          <button
            onClick={handleDelete}
            disabled={submitting}
            className="px-3 py-2 rounded-lg border border-rose-400 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            Delete
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-8 space-y-10 dark:text-slate-300 text-slate-700">

          {/* --- Identity Section --- */}
          <Section title="Identity">
            <Grid2>
              <Field label="Username">
                <Input value={form.username ?? ''} onChange={(e) => update('username', e.target.value)} />
              </Field>

              <Field label="Email">
                <Input value={form.email ?? ''} onChange={(e) => update('email', e.target.value)} />
              </Field>

              <Field label="First Name">
                <Input value={form.first_name ?? ''} onChange={(e) => update('first_name', e.target.value)} />
              </Field>

              <Field label="Middle Name">
                <Input value={form.middle_name ?? ''} onChange={(e) => update('middle_name', e.target.value)} />
              </Field>

              <Field label="Last Name">
                <Input value={form.last_name ?? ''} onChange={(e) => update('last_name', e.target.value)} />
              </Field>

              <Field label="Gender">
                 <Input value={form.gender ?? ''} />
              </Field>

              <Field label="Birthday">
                <Input
                  value={form.birthday ?? ''}
                />
              </Field>
            </Grid2>
          </Section>

          {/* --- Organization Section --- */}
          <Section title="Organization">
            <Grid2>
              <Field label="Department">
                <Input value={form.department ?? ''} onChange={(e) => update('department', e.target.value)} />
              </Field>

              <Field label="Unit">
                <Input value={form.unit ?? ''} onChange={(e) => update('unit', e.target.value)} />
              </Field>

              <Field label="Site">
                <Input value={form.site ?? ''} onChange={(e) => update('site', e.target.value)} />
              </Field>

              <Field label="Address">
                <Input value={form.address ?? ''} onChange={(e) => update('address', e.target.value)} />
              </Field>

              <Field label="Country">
                <Input value={form.country ?? ''} onChange={(e) => update('country', e.target.value)} />
              </Field>
            </Grid2>
          </Section>

          {/* --- Contact & Flags --- */}
          <Section title="Contact & Flags">
            <Grid2>
              <Field label="Phone">
                <Input value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
              </Field>

              <Field label="RSS Token">
                <Input value={form.rss_token ?? ''} onChange={(e) => update('rss_token', e.target.value)} />
              </Field>
            </Grid2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
              <Toggle label="Admin" checked={!!form.admin} onChange={(v) => update('admin', v)} />
              <Toggle label="Active" checked={!!form.active} onChange={(v) => update('active', v)} />
              <Toggle label="Approved" checked={!!form.approved} onChange={(v) => update('approved', v)} />
              <Toggle label="Locked" checked={!!form.locked} onChange={(v) => update('locked', v)} />
            </div>
          </Section>

          {/* --- Skills & Worksites --- */}
          <Section title="Skills & Worksites">
            <Grid2>
              <Field label="Skills (comma separated)">
                <Input
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="java, python, qa"
                />
              </Field>

              <div />

              <Field label="Primary Worksite (JSON)">
                <Textarea
                  value={primaryWsText}
                  onChange={(e) => setPrimaryWsText(e.target.value)}
                />
              </Field>

              <Field label="Secondary Worksite (JSON)">
                <Textarea
                  value={secondaryWsText}
                  onChange={(e) => setSecondaryWsText(e.target.value)}
                />
              </Field>
            </Grid2>
          </Section>
        </div>

        {/* FOOTER */}
        <div className="border-t px-6 py-4 flex justify-end gap-3 dark:border-slate-700">
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <button
            disabled={!isDirty || submitting}
            onClick={handleUpdate}
            className={
              !isDirty || submitting
                ? "px-4 py-2 rounded-lg bg-blue-400/60 text-white cursor-not-allowed"
                : "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {submitting ? "Saving..." : "Update User"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI Helpers ----------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-4 dark:text-slate-200 text-slate-800">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}

function Field({ label, required, children }: any) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium dark:text-slate-300 text-slate-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 " +
        "text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 " +
        (props.className ?? "")
      }
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full min-h-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 " +
        "text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 " +
        (props.className ?? "")
      }
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 " +
        "text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-blue-500"
      }
    />
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
      />
      <span className="dark:text-slate-300 text-slate-700">{label}</span>
    </label>
  );
}
