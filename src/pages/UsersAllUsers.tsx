import { UsersTable } from "../components/layout/users/userTable";
import { useQuery } from "@tanstack/react-query";
import { getQMSBackend } from "../generated/sdk/endpoints";
import React from "react";
import { type UserSummary } from "../generated/sdk/models";
import { type User } from "../components/layout/users/userTable";


  const api = getQMSBackend();
  
 export const toUser = (s: UserSummary): User => ({
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    username: s.username,
    email: s.email,
    isAdmin: s.admin,
    active: s.active,

    // Fields not present in summary → provide defaults/derivations as you see fit
    middleInitial: undefined,
    department: s.department,
    unit: s.unit,
    userNumber: String(s.id),
    externalLogin: false,
    twoFactorEnabled: false,
  });

export default function UsersAllUsers() {



  const limit = 50;
  const offset = 0;

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['users', limit, offset],
    queryFn: async () => {
      const res = await api.users_v1_get_listUsers();
      // res.data: UserSummary[]
      return res.data;
    },
    // Ensure we always have an array during initial render
    initialData: [],
    // Transform to the UI shape your table expects
    select: (summaries: UserSummary[]) => summaries.map(toUser),
    staleTime: 0,
    retry: 1,
  });
   console.log(users)

  return (
    <div>
      <UsersTable users={users} onEdit={() => {}} isLoading={isLoading} error={error} />
    </div>
  );
}
