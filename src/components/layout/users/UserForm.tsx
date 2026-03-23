import React from 'react';
import { Box, Button, MenuItem, Select, Stack, TextField, Typography, Snackbar, Alert } from '@mui/material';
import { darkInput, darkText } from '../../common/T-colors';
import { OrganizationSection,emptyWorksite,toWorksiteOrUndef } from './organizationSection';
import type { WorksiteInfoUi,OrgErrors } from './organizationSection';
import { useApi } from '../../../lib/errors/useApi';
import { parsePydanticFieldErrors } from '../../../lib/errors/parsePydanticFieldErrors';
import type{ UserCreate, UserUpdate } from '../../../generated/sdk/models';
import { COUNTRIES } from '../../constants/countries';
import { getQMSBackend } from '../../../generated/sdk/endpoints';

// ---- UI-friendly form type ----
type UserCreateUI = {
  username: string;
  email: string;
  department: string;
  role_id: number | '';
  unit: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | '';
  birthday: string | null;
  phone: string;
  site: string | null;
  address: string | null;
  country: string | '';
  password: string; // set empty in edit mode if password not changeable
};

export type NonEditableField =
  | keyof UserCreateUI
  | 'primary_worksite_info'
  | 'secondary_worksite_info'
  | 'role_id'
  | 'department'
  | 'unit'
  | 'country';

type Props = {
  mode: 'create' | 'edit';
  initialForm?: Partial<UserCreateUI>;
  initialPrimary?: WorksiteInfoUi;
  initialSecondary?: WorksiteInfoUi;
  nonEditable?: NonEditableField[];
  roles: { id: number; name: string }[];
  departments: string[];
  units: string[];
  onSuccess?: () => void;
  onSubmitCreate?: (payload: UserCreate) => Promise<any>;
  onSubmitEdit?: (payload: UserUpdate) => Promise<any>;
};

export default function UserForm({
  mode,
  initialForm,
  initialPrimary,
  initialSecondary,
  nonEditable = [],
  roles,
  departments,
  units,
  onSuccess,
  onSubmitCreate,
  onSubmitEdit,
}: Props) {
  const [form, setForm] = React.useState<UserCreateUI>({
    username: '',
    email: '',
    department: '',
    role_id: '',
    unit: '',
    first_name: '',
    middle_name: null,
    last_name: '',
    gender: '',
    birthday: null,
    phone: '',
    site: null,
    address: null,
    country: '',
    password: '', // for edit, we won't send if non-editable
    ...(initialForm || {}),
  });

  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [primaryWs, setPrimaryWs] = React.useState<WorksiteInfoUi>(initialPrimary || emptyWorksite());
  const [secondaryWs, setSecondaryWs] = React.useState<WorksiteInfoUi>(initialSecondary || emptyWorksite());

  const [fieldErr, setFieldErr] = React.useState<Record<string, string>>({});
  const [primaryWsErr, setPrimaryWsErr] = React.useState<OrgErrors>({});
  const [toast, setToast] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const api = React.useMemo(() => getQMSBackend(), []);

  const setVal = <K extends keyof UserCreateUI>(key: K, val: UserCreateUI[K]) => {
    setFieldErr((f) => ({ ...f, [String(key)]: '' }));
    setForm((s) => ({ ...s, [key]: val }));
  };
  const isDisabled = (k: NonEditableField) => nonEditable.includes(k);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const wsErr: OrgErrors = {};

    if (!form.username || form.username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    if (!form.email) errs.email = 'Email is required';
    if (!form.department) errs.department = 'Department is required';
    if (form.role_id === '' || form.role_id === undefined || form.role_id === null) errs.role_id = 'Role is required';
    if (!form.unit) errs.unit = 'Unit is required';
    if (!form.first_name) errs.first_name = 'First name is required';
    if (!form.last_name) errs.last_name = 'Last name is required';
    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.phone) errs.phone = 'Phone is required';
    if (!form.country) errs.country = 'Country is required';

    // Only in create mode (password must be set and confirmed)
    if (mode === 'create') {
      if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters';
      if (confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match';
    }

    // Primary worksite minimal
    const p = primaryWs;
    if (!p.code) wsErr.code = 'Required';
    if (!p.name) wsErr.name = 'Required';
    if (!p.country) wsErr.country = 'Required';

    setFieldErr(errs);
    setPrimaryWsErr(wsErr);
    return Object.keys(errs).length === 0 && Object.keys(wsErr).length === 0;
  };

  const { run, loading } = useApi(async () => {
    const primary = toWorksiteOrUndef(primaryWs);
    const secondary = toWorksiteOrUndef(secondaryWs);
    if (!primary) throw new Error('Primary worksite is required');

    if (mode === 'create') {
      // Build UserCreate
      const payload: UserCreate = {
        username: form.username,
        email: form.email,
        department: form.department,
        role_id: Number(form.role_id),
        unit: form.unit,
        first_name: form.first_name,
        middle_name: form.middle_name ?? undefined,
        last_name: form.last_name,
        gender: form.gender || undefined,
        birthday: form.birthday ?? undefined,
        phone: form.phone,
        site: form.site ?? undefined,
        address: form.address ?? undefined,
        country: form.country || undefined,
        primary_worksite_info: primary,
        ...(secondary ? { secondary_worksite_info: secondary } : {}),
        password: form.password,
      };

      if (onSubmitCreate) return onSubmitCreate(payload);
      // default: use your factory directly
      return api.auth_v1_post_register(payload);
    } else {
      // Build UserUpdate (match your model; example below uses partial fields)
      const updatePayload: UserUpdate = {
        username: form.username,            // if server allows changing; if not, omit
        email: form.email,
        department: form.department,
        role_id: Number(form.role_id),
        unit: form.unit,
        first_name: form.first_name,
        middle_name: form.middle_name ?? undefined,
        last_name: form.last_name,
        phone: form.phone,
        site: form.site ?? undefined,
        address: form.address ?? undefined,
        country: form.country || undefined,
        primary_worksite_info: toWorksiteOrUndef(primaryWs),
        ...(secondary ? { secondary_worksite_info: secondary } : {}),
        // If password is not editable in edit mode, omit it
      } as UserUpdate;

      if (onSubmitEdit) return onSubmitEdit(updatePayload);
      // If you need default update, pass a handler from the Edit page with the ID
      throw new Error('onSubmitEdit handler is required for edit mode');
    }
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await run();
    if (!result.ok) {
      const err = result.error;
      const raw = (err?.raw as any)?.response?.data;
      const p = parsePydanticFieldErrors(raw?.detail);
      if (Object.keys(p).length > 0) setFieldErr((prev) => ({ ...prev, ...p }));
      else if (err?.field) setFieldErr((f) => ({ ...f, [err.field!]: err.userMessage || 'Invalid value' }));
      else setToast({ open: true, message: err?.userMessage || 'Operation failed', severity: 'error' });
      return;
    }

    setToast({ open: true, message: mode === 'create' ? 'User created successfully' : 'User updated successfully', severity: 'success' });
    onSuccess?.();
  };

  return (
    <Box component="form" onSubmit={onSubmit} className="text-slate-500 dark:text-slate-400 bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" sx={darkText}>{mode === 'create' ? 'Register User' : 'Edit User'}</Typography>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" color="inherit" type="button" onClick={() => window.history.back()} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Saving…' : mode === 'create' ? 'Save' : 'Update'}
          </Button>
        </Stack>
      </Stack>

      {/* Personal Information */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ ...darkText, fontWeight: 600, mb: 1 }}>
          Personal Information
        </Typography>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextField label="First Name" size="small" value={form.first_name} onChange={(e) => setVal('first_name', e.target.value)} error={!!fieldErr.first_name} helperText={fieldErr.first_name} fullWidth sx={darkInput} required disabled={isDisabled('first_name')} />
          <TextField label="Middle Name" size="small" value={form.middle_name ?? ''} onChange={(e) => setVal('middle_name', e.target.value || null)} error={!!fieldErr.middle_name} helperText={fieldErr.middle_name} fullWidth sx={darkInput} disabled={isDisabled('middle_name')} />
          <TextField label="Last Name" size="small" value={form.last_name} onChange={(e) => setVal('last_name', e.target.value)} error={!!fieldErr.last_name} helperText={fieldErr.last_name} fullWidth sx={darkInput} required disabled={isDisabled('last_name')} />

          <TextField label="Username" size="small" value={form.username} onChange={(e) => setVal('username', e.target.value)} error={!!fieldErr.username} helperText={fieldErr.username} fullWidth sx={darkInput} required disabled={isDisabled('username')} />

          <div>
            <Select size="small" value={form.gender ?? ''} onChange={(e) => setVal('gender', (e.target.value || '') as any)} displayEmpty sx={{ minWidth: 160, ...darkInput }} fullWidth error={!!fieldErr.gender} disabled={isDisabled('gender')}>
              <MenuItem value=""><em>-- Gender --</em></MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
              <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
            </Select>
            {fieldErr.gender && <Typography variant="caption" color="error">{fieldErr.gender}</Typography>}
          </div>

          <TextField label="Birthday" size="small" type="date" value={form.birthday ?? ''} onChange={(e) => setVal('birthday', e.target.value || null)} error={!!fieldErr.birthday} helperText={fieldErr.birthday} fullWidth sx={darkInput} InputLabelProps={{ shrink: true }} disabled={isDisabled('birthday')} />
        </div>
      </Box>

      {/* Contact Information */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ ...darkText, fontWeight: 600, mb: 1 }}>Contact Information</Typography>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextField label="Email" size="small" type="email" value={form.email} onChange={(e) => setVal('email', e.target.value)} error={!!fieldErr.email} helperText={fieldErr.email} fullWidth sx={darkInput} required disabled={isDisabled('email')} />
          <TextField label="Phone" size="small" value={form.phone ?? ''} onChange={(e) => setVal('phone', e.target.value || '')} error={!!fieldErr.phone} helperText={fieldErr.phone} fullWidth sx={darkInput} required disabled={isDisabled('phone')} />
          <TextField label="Site" size="small" value={form.site ?? ''} onChange={(e) => setVal('site', e.target.value || null)} error={!!fieldErr.site} helperText={fieldErr.site} fullWidth sx={darkInput} disabled={isDisabled('site')} />

          <TextField label="Address" size="small" value={form.address ?? ''} onChange={(e) => setVal('address', e.target.value || null)} error={!!fieldErr.address} helperText={fieldErr.address} fullWidth sx={darkInput} className="md:col-span-2" disabled={isDisabled('address')} />

          <div>
            <Select size="small" fullWidth displayEmpty value={form.country ?? ''} onChange={(e) => setVal('country', (e.target.value || '') as any)} sx={{ minWidth: 160, ...darkInput }} error={!!fieldErr.country} disabled={isDisabled('country')}>
              <MenuItem value=""><em>-- Select Country --</em></MenuItem>
              {COUNTRIES.map((c) => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}
            </Select>
            {fieldErr.country && <Typography variant="caption" color="error">{fieldErr.country}</Typography>}
          </div>

          {/* Password — disable in edit if nonEditable includes 'password' */}
          <TextField label="Password" size="small" type="password" value={form.password} onChange={(e) => setVal('password', e.target.value)} error={!!fieldErr.password} helperText={fieldErr.password} fullWidth sx={darkInput} required={mode === 'create'} disabled={isDisabled('password')} />
          {mode === 'create' && (
            <TextField label="Confirm Password" size="small" type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setFieldErr((f) => ({ ...f, confirmPassword: '' })); }} error={!!fieldErr.confirmPassword} helperText={fieldErr.confirmPassword} fullWidth sx={darkInput} />
          )}
        </div>
      </Box>

      {/* Organization */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ ...darkText, fontWeight: 600, mb: 1 }}>Organization</Typography>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Select size="small" value={form.department ?? ''} onChange={(e) => setVal('department', (e.target.value || '') as any)} displayEmpty sx={{ minWidth: 160, ...darkInput }} fullWidth error={!!fieldErr.department} disabled={isDisabled('department')}>
              <MenuItem value=""><em>-- Select Department --</em></MenuItem>
              {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
            {fieldErr.department && <Typography variant="caption" color="error">{fieldErr.department}</Typography>}
          </div>

          <div>
            <Select size="small" value={form.unit ?? ''} onChange={(e) => setVal('unit', (e.target.value || '') as any)} displayEmpty sx={{ minWidth: 160, ...darkInput }} fullWidth error={!!fieldErr.unit} disabled={isDisabled('unit')}>
              <MenuItem value=""><em>-- Select Unit --</em></MenuItem>
              {units.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </Select>
            {fieldErr.unit && <Typography variant="caption" color="error">{fieldErr.unit}</Typography>}
          </div>

          <div>
            <Select size="small" value={form.role_id ?? ''} onChange={(e) => setVal('role_id', Number(e.target.value))} displayEmpty sx={{ minWidth: 160, ...darkInput }} fullWidth error={!!fieldErr.role_id} disabled={isDisabled('role_id')}>
              <MenuItem value=""><em>-- Select Role --</em></MenuItem>
              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </Select>
            {fieldErr.role_id && <Typography variant="caption" color="error">{fieldErr.role_id}</Typography>}
          </div>
        </div>

        <div className="mt-3">
          <OrganizationSection title="Primary Worksite (required)" value={primaryWs} onChange={setPrimaryWs} errors={primaryWsErr} />
        </div>
        <div className="mt-3">
          <OrganizationSection title="Secondary Worksite (optional)" value={secondaryWs} onChange={setSecondaryWs} />
        </div>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setToast((t) => ({ ...t, open: false }))} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}