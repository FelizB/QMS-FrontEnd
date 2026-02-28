// src/features/users/UsersTable.tsx
import { useQuery } from '@tanstack/react-query';
import { getQMSBackend } from '../../generated/sdk/endpoints'; 

// Create a single instance of your generated client
const api = getQMSBackend();

export function UsersTable() {
  const limit = 50;
  const offset = 0;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', limit, offset],
    queryFn: async () => {
      // The generated function returns Promise<AxiosResponse<UserSummary[]>>
      const res = await api.users_v1_get_listUsers();
      return res.data; // <-- return the typed DTOs
    },
    staleTime: 0,
    retry: 1,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error)     return <div className="text-red-500">Failed to load users</div>;

  return (
    <div>
      <button onClick={() => refetch()} className="mb-2">Refresh</button>
      <ul className="space-y-1">
        {data?.map(u => (
          <li key={u.id}>
            <span className="font-semibold">{u.id}</span>{' '}
            <span className="font-semibold">{u.username}</span>{' '}
            <span className="text-slate-500">{u.email}</span>{' '}
            <span className="font-semibold">{u.created_at}</span>{' '}
            <span className="font-semibold">{u.updated_at}</span>{' '}
            <span className="font-semibold">{u.unit}</span>{' '}
            <span className="font-semibold">{u.department}</span>{' '}
            <span className="font-semibold">{u.role}</span>{' '}
            <span className="font-semibold">{u.active}</span>{' '}
            <span className="font-semibold">{u.admin}</span>{' '}
            <span className="font-semibold">{u.superuser}</span>{' '}
          </li>
        ))}
      </ul>
    </div>
  );
}