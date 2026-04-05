import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserForm from './UserForm';
import { getQMSBackend } from '../../../generated/sdk/endpoints';
import { useRouteMessage } from '../../../lib/success/RouteMessageContext';
import { useReferenceData } from './hooks/useReferenceData';


export default function RegisterUserPage() {
  const navigate = useNavigate();
  const { show } = useRouteMessage();
  const { roles, departments, units, loading, error, refetch } = useReferenceData();

  {error && (
    <div className="text-red-500 text-sm">
      {error}{" "}
      <button className="underline" onClick={() => void refetch()}>
        Retry
      </button>
    </div>
  )}

  const api = React.useMemo(() => getQMSBackend(), []);

  return (
    <UserForm
      mode="create"
      roles={roles}
      departments={departments}
      units={units}
      nonEditable={[]}
      onSubmitCreate={(payload: any) => api.auth_v1_post_register(payload)}
      
     onError={(msg) =>
        show({ message: msg, severity: 'error' })
      }
      onSuccess={() => {
        show({
          message: 'User created successfully',
          severity: 'success',
        });
        setTimeout(() => navigate('/users/all-users'), 600);
      }}

    />
  );
}