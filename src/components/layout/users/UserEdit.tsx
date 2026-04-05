import React from 'react';
  import UserForm from './UserForm';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getQMSBackend } from '../../../generated/sdk/endpoints';
import { useRouteMessage } from '../../../lib/success/RouteMessageContext';
import { useReferenceData } from './hooks/useReferenceData';

// ---------- helpers ----------
const toUndef = <T,>(v: T | null | undefined): T | undefined =>
  v === null ? undefined : v;

const countryNameToCode = (value?: string | null): string => {
  if (!value) return '';
  const map: Record<string, string> = {
    Kenya: 'KE',
    Uganda: 'UG',
    Tanzania: 'TZ',
    Rwanda: 'RW',
    Burundi: 'BI',
    Ethiopia: 'ET',
    'South Sudan': 'SS',
    Nigeria: 'NG',
    'South Africa': 'ZA',
    'United Kingdom': 'GB',
    'United States': 'US',
  };

  const v = value.trim();
  if (/^[A-Z]{2}$/.test(v)) return v; // already a code
  return map[v] ?? '';
};

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
    const { show } = useRouteMessage();
  const location = useLocation();
  const api = React.useMemo(() => getQMSBackend(), []);

  const { roles, departments, units } = useReferenceData();

  const [loaded, setLoaded] = React.useState(false);
  const [initialForm, setInitialForm] = React.useState<any>(null);
  const [primaryWs, setPrimaryWs] = React.useState<any>(null);
  const [secondaryWs, setSecondaryWs] = React.useState<any>(null);

  // ---------- 1) FAST PATH (navigation state) ----------
  React.useEffect(() => {
    const baseline = location.state?.initialUpdateBaseline;
    if (!baseline) return;

    setInitialForm({
      username: baseline.username ?? '',
      email: baseline.email ?? '',
      department: baseline.department ?? '',
      unit: baseline.unit ?? '',
      role_id: baseline.role_id ?? '',
      first_name: baseline.first_name ?? '',
      middle_name: toUndef(baseline.middle_name),
      last_name: baseline.last_name ?? '',
      gender: baseline.gender ? String(baseline.gender).toLowerCase() : '',
      birthday: toUndef(baseline.birthday),
      phone: baseline.phone ?? '',
      site: toUndef(baseline.site),
      address: toUndef(baseline.address),
      country: countryNameToCode(baseline.country),
      password: '',
    });

    setPrimaryWs({
      code: baseline.primary_worksite_info?.code ?? '',
      name: baseline.primary_worksite_info?.name ?? '',
      address: baseline.primary_worksite_info?.address ?? '',
      city: baseline.primary_worksite_info?.city ?? '',
      country: countryNameToCode(baseline.primary_worksite_info?.country),
      extras: [],
    });

    setSecondaryWs({
      code: baseline.secondary_worksite_info?.code ?? '',
      name: baseline.secondary_worksite_info?.name ?? '',
      address: baseline.secondary_worksite_info?.address ?? '',
      city: baseline.secondary_worksite_info?.city ?? '',
      country: countryNameToCode(baseline.secondary_worksite_info?.country),
      extras: [],
    });

    setLoaded(true);
  }, [location.state]);

  // ---------- 2) BACKEND FETCH ----------
  React.useEffect(() => {
    if (loaded) return;

    const fetchUser = async () => {
      const resp = await api.users_v1_get_getUserByIdDetailed(Number(id));
      const u = resp.data ?? resp;

      setInitialForm({
        username: u.username ?? '',
        email: u.email ?? '',
        department: u.department ?? '',
        unit: u.unit ?? '',
        role_id: u.role?.id ?? '',
        first_name: u.first_name ?? '',
        middle_name: toUndef(u.middle_name),
        last_name: u.last_name ?? '',
        gender: u.gender ? String(u.gender).toLowerCase() : '',
        birthday: toUndef(u.birthday),
        phone: u.phone ?? '',
        site: toUndef(u.site),
        address: toUndef(u.address),
        country: countryNameToCode(u.country),
        password: '',
      });

      setPrimaryWs({
        code: u.primary_worksite_info?.code ?? '',
        name: u.primary_worksite_info?.name ?? '',
        address: u.primary_worksite_info?.address ?? '',
        city: u.primary_worksite_info?.city ?? '',
        country: countryNameToCode(u.primary_worksite_info?.country),
        extras: [],
      });

      setSecondaryWs({
        code: u.secondary_worksite_info?.code ?? '',
        name: u.secondary_worksite_info?.name ?? '',
        address: u.secondary_worksite_info?.address ?? '',
        city: u.secondary_worksite_info?.city ?? '',
        country: countryNameToCode(u.secondary_worksite_info?.country),
        extras: [],
      });

      setLoaded(true);
    };

    fetchUser();
  }, [loaded, id, api]);

  // ---------- HARD GATE ----------
  if (
    !loaded ||
    !initialForm ||
    !roles.length ||
    !departments.length ||
    !units.length
  ) {
    return <div>Loading…</div>;
  }

  // ---------- RENDER ----------
  return (
    <UserForm
      mode="edit"
      initialForm={initialForm}
      initialPrimary={primaryWs}
      initialSecondary={secondaryWs}
      roles={roles}
      departments={departments}
      units={units}
      nonEditable={['username', 'password']}
      onSubmitEdit={(payload) =>
        api.users_v1_patch_updateUser(Number(id), payload)
      }
     
      onError={(msg) =>
        show({ message: msg, severity: 'error' })
      }
      onSuccess={() => {
        show({
          message: 'User Updated successfully',
          severity: 'success',
        });
        setTimeout(() => navigate('/users/all-users'), 600);
      }}
    />
  );
}

