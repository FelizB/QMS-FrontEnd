import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserForm from './UserForm';
import { getQMSBackend } from '../../../generated/sdk/endpoints';

// Replace these with your real reference calls
export function useReferenceData() {
  const [roles, setRoles] = React.useState<{ id: number; name: string }[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [units, setUnits] = React.useState<string[]>([]);
  React.useEffect(() => {
    setRoles([{ id: 1, name: 'Admin' }, { id: 2, name: 'User' }]);
    setDepartments(['IT', 'Finance']);
    setUnits(['Core', 'Channel']);
  }, []);
  return { roles, departments, units };
}

export default function RegisterUserPage() {
  const navigate = useNavigate();
  const { roles, departments, units } = useReferenceData();
  const api = React.useMemo(() => getQMSBackend(), []);

  return (
    <UserForm
      mode="create"
      roles={roles}
      departments={departments}
      units={units}
      nonEditable={[]}
      onSubmitCreate={(payload: any) => api.auth_v1_post_register(payload)}
      onSuccess={() => setTimeout(() => navigate('/users'), 600)}
    />
  );
}