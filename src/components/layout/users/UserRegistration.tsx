import React, { useState } from 'react';
import { useUserMutations } from './useUserMutations';
import type { UserCreate } from '../../../generated/sdk/models';

export default function UserRegistrationPage() {
  const { createUserAsync } = useUserMutations();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<UserCreate>({
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
  });

  const [skillsText, setSkillsText] = useState('');
  const [primaryWsText, setPrimaryWsText] = useState('');
  const [secondaryWsText, setSecondaryWsText] = useState('');

  const update = (key: keyof UserCreate, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  const createValid =
    form.username.trim().length >= 3 &&
    form.email.trim().length > 0 &&
    form.department.trim().length > 0 &&
    form.role.trim().length > 0 &&
    form.unit.trim().length > 0 &&
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    form.password.trim().length >= 8;

  const toSkills = (text: string): string[] | undefined =>
    text.trim() === '' ? undefined : text.split(',').map((s) => s.trim()).filter(Boolean);

  const parseJson = (text: string): any | null => {
    if (!text.trim()) return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      alert('Invalid JSON in worksite fields');
      throw err;
    }
  };

  const handleSubmit = async () => {
    try {
      if (!createValid) return;

      setSubmitting(true);

      const payload: UserCreate = {
        ...form,
        skills: toSkills(skillsText),
        primary_worksite_info: primaryWsText ? parseJson(primaryWsText) : undefined,
        secondary_worksite_info: secondaryWsText ? parseJson(secondaryWsText) : undefined,
      };

      await createUserAsync(payload);
      alert('User created successfully');
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-slate-50 dark:bg-slate-900 py-10 px-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Register New User
          </h1>
        </div>

        {/* Body */}
        <div className="px-6 py-8 space-y-10 text-slate-700 dark:text-slate-300">

          {/* Identity */}
          <Section title="Identity">
            <Grid2>
              <Field label="Username" required>
                <Input value={form.username} onChange={(e) => update('username', e.target.value)} />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
              </Field>
              <Field label="First Name" required>
                <Input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
              </Field>
              <Field label="Middle Name">
                <Input value={form.middle_name ?? ''} onChange={(e) => update('middle_name', e.target.value)} />
              </Field>
              <Field label="Last Name" required>
                <Input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
              </Field>
              <Field label="Gender">
                <Select
                  value={form.gender ?? ''}
                  onChange={(e) => update('gender', e.target.value || null)}
                >
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Birthday">
                <Input type="date" value={form.birthday ?? ''} 
                  onChange={(e) => update('birthday', e.target.value || null)} />
              </Field>
            </Grid2>
          </Section>

          {/* Organization */}
          <Section title="Organization">
            <Grid2>
              <Field label="Department" required>
                <Input value={form.department} onChange={(e) => update('department', e.target.value)} />
              </Field>
              <Field label="Unit" required>
                <Input value={form.unit} onChange={(e) => update('unit', e.target.value)} />
              </Field>
              <Field label="Role" required>
                <Input value={form.role} onChange={(e) => update('role', e.target.value)} />
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

          {/* Contact & Security */}
          <Section title="Contact & Security">
            <Grid2>
              <Field label="Phone">
                <Input value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
              </Field>

              <Field label="Password" required>
                <Input type="password" value={form.password} placeholder="Min 8 characters"
                  onChange={(e) => update('password', e.target.value)} />
              </Field>

              <Field label="RSS Token">
                <Input value={form.rss_token ?? ''} onChange={(e) => update('rss_token', e.target.value)} />
              </Field>
            </Grid2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Toggle label="Admin" checked={form.admin || false} onChange={(v: any) => update('admin', v)} />
              <Toggle label="Superuser" checked={form.superuser || false} onChange={(v: any) => update('superuser', v)} />
            </div>
          </Section>

          {/* Skills & Worksites */}
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
                  placeholder='{"siteCode": "HQ01"}'
                />
              </Field>
              <Field label="Secondary Worksite (JSON)">
                <Textarea
                  value={secondaryWsText}
                  onChange={(e) => setSecondaryWsText(e.target.value)}
                  placeholder='{"siteCode": "BR02"}'
                />
              </Field>
            </Grid2>
          </Section>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>

          <button
            disabled={!createValid || submitting}
            onClick={handleSubmit}
            className={
              !createValid || submitting
                ? "px-4 py-2 rounded-lg bg-blue-400/60 text-white cursor-not-allowed"
                : "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {submitting ? "Saving..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- UI Components -------------------- */

function Section({ title, children }: any) {
  return (
    <section>
      <h2 className="text-md font-semibold mb-4 text-slate-800 dark:text-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function Grid2({ children }: any) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}

function Field({ label, required, children }: any) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 
                 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 
                 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full min-h-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 
                 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 
                 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 
                 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
      />
      <span>{label}</span>
    </label>
  );
}
