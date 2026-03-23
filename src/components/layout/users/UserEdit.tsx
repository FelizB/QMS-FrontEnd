import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import UserForm from './UserForm';
import { getQMSBackend } from '../../../generated/sdk/endpoints';
import type{ UserCreate } from '../../../generated/sdk/models';
import { useReferenceData } from './UserRegistration';
export default function EditUserPage() {
  const { id } = useParams();                        
  const navigate = useNavigate();
  const location = useLocation();
  const api = React.useMemo(() => getQMSBackend(), []);

  const [loaded, setLoaded] = React.useState(false);
  const [initialForm, setInitialForm] = React.useState<any>(null);
  const [primaryWs, setPrimaryWs] = React.useState<any>(null);
  const [secondaryWs, setSecondaryWs] = React.useState<any>(null);

  // You probably have roles/departments/units hooks — placeholder example:
  const { roles, departments, units } = useReferenceData();

  // 1) Prefer location.state for instant fill
  React.useEffect(() => {
    if (location.state?.initialUpdateBaseline) {
      const baseline = location.state.initialUpdateBaseline;

      // Fill UI form fields
      setInitialForm({
        username: baseline.username,
        email: baseline.email,
        department: baseline.department ?? '',
        role_id: baseline.role_id ?? '',
        unit: baseline.unit ?? '',
        first_name: baseline.first_name,
        middle_name: baseline.middle_name,
        last_name: baseline.last_name,
        gender: baseline.gender ?? '',
        birthday: baseline.birthday ?? null,
        phone: baseline.phone ?? '',
        site: baseline.site ?? null,
        address: baseline.address ?? null,
        country: baseline.country ?? '',
        password: '',       // keep blank for edit mode
      });

      setPrimaryWs({
        code: baseline.primary_worksite_info?.code ?? '',
        name: baseline.primary_worksite_info?.name ?? '',
        address: baseline.primary_worksite_info?.address ?? '',
        city: baseline.primary_worksite_info?.city ?? '',
        country: baseline.primary_worksite_info?.country ?? '',
        extras: [],
      });

      setSecondaryWs({
        code: baseline.secondary_worksite_info?.code ?? '',
        name: baseline.secondary_worksite_info?.name ?? '',
        address: baseline.secondary_worksite_info?.address ?? '',
        city: baseline.secondary_worksite_info?.city ?? '',
        country: baseline.secondary_worksite_info?.country ?? '',
        extras: [],
      });

      setLoaded(true);
      return;
    }
  }, [location.state]);

  // 2) If user refreshed — fetch from backend
  React.useEffect(() => {
    if (loaded) return;

    const fetchUser = async () => {
      const resp = await api.users_v1_get_getUserByIdDetailed(Number(id));
      const u = resp.data ?? resp;

      setInitialForm({
        username: u.username,
        email: u.email,
        department: u.department ?? '',
        role_id: u.role.id ?? '',
        role_name: u.role.name ?? '',
        unit: u.unit ?? '',
        first_name: u.first_name,
        middle_name: u.middle_name,
        last_name: u.last_name,
        gender: u.gender ?? '',
        birthday: u.birthday ?? null,
        phone: u.phone ?? '',
        site: u.site ?? null,
        address: u.address ?? null,
        country: u.country ?? '',
        password: '',
      });

      setPrimaryWs({
        code: u.primary_worksite_info?.code ?? '',
        name: u.primary_worksite_info?.name ?? '',
        address: u.primary_worksite_info?.address ?? '',
        city: u.primary_worksite_info?.city ?? '',
        country: u.primary_worksite_info?.country ?? '',
        extras: [],
      });

      setSecondaryWs({
        code: u.secondary_worksite_info?.code ?? '',
        name: u.secondary_worksite_info?.name ?? '',
        address: u.secondary_worksite_info?.address ?? '',
        city: u.secondary_worksite_info?.city ?? '',
        country: u.secondary_worksite_info?.country ?? '',
        extras: [],
      });

      setLoaded(true);
    };

    fetchUser();
  }, [loaded, id, api]);

  if (!loaded || !initialForm) return <div>Loading…</div>;

  return (
    <UserForm
      mode="edit"
      initialPrimary={primaryWs}
      initialSecondary={secondaryWs}
      roles={roles}
      departments={departments}
      units={units}
      // Disable fields you don't want editable:
      nonEditable={['username', 'password']}
      onSubmitEdit={(payload) => api.users_v1_patch_updateUser(Number(id), payload)}
      onSuccess={() => navigate('/users')}
    />
  );
}