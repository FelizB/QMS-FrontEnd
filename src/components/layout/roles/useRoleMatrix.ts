import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qmsApi as api } from '../../../api/apiEndpoints';

// ---- Result type helpers based on your provided shapes ----
export type RoleMatrixV1GetListRolesResult = NonNullable<
  Awaited<ReturnType<typeof api.role_matrix_v1_get_listRoles>>
>;
export type RoleMatrixV1PostCreateRoleResult = NonNullable<
  Awaited<ReturnType<typeof api.role_matrix_v1_post_createRole>>
>;
export type RoleMatrixV1DeleteDeleteRoleResult = NonNullable<
  Awaited<ReturnType<typeof api.role_matrix_v1_delete_deleteRole>>
>;

export type RoleMatrixV1GetListActionsResult = NonNullable<
  Awaited<ReturnType<typeof api.role_matrix_v1_get_listActions>>
>;
export type RoleMatrixV1PostCreateActionResult = NonNullable<
  Awaited<ReturnType<typeof api.role_matrix_v1_post_createAction>>
>;
export type RoleMatrixV1DeleteDeleteActionResult = NonNullable<
  Awaited<ReturnType<typeof api.role_matrix_v1_delete_deleteAction>>
>;

export type RoleMatrixV1GetListGrantsResult = NonNullable<
  Awaited<ReturnType<typeof api.role_matrix_v1_get_listGrants>>
>;
export type RoleMatrixV1PutUpsertGrantResult = NonNullable<
  Awaited<ReturnType<typeof api.role_matrix_v1_put_upsertGrant>>
>;

// Element shapes (arrays)
export type RoleDto   = RoleMatrixV1GetListRolesResult['data'][number];
export type ActionDto = RoleMatrixV1GetListActionsResult['data'][number];
export type GrantDto  = RoleMatrixV1GetListGrantsResult['data'][number];


function logError(err: unknown, label: string) {
  const a = err as any;
  // prints backend error payload (e.g., {detail: ...}) or message
  // eslint-disable-next-line no-console
  console.error(`[RBAC:${label}]`, a?.response?.data ?? a?.message ?? a);
}
// src/features/rbac/useRoleMatrix.ts

// ... (types as you already have) ...

// ---- Queries (ALWAYS return arrays, not AxiosResponse) ----
export function useRoles() {
  return useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: async () => {
      const resp = await api.role_matrix_v1_get_listRoles();
      return Array.isArray(resp) ? resp : resp?.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useActions() {
  return useQuery({
    queryKey: ['rbac', 'actions'],
    queryFn: async () => {
      const resp = await api.role_matrix_v1_get_listActions();
      return Array.isArray(resp) ? resp : resp?.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useGrants(entityType?: string) {
  return useQuery({
    queryKey: ['rbac', 'grants', entityType ?? '__global__'],
    queryFn: async () => {
      const resp = await api.role_matrix_v1_get_listGrants({ entity_type: entityType });
      return Array.isArray(resp) ? resp : resp?.data ?? [];
    },
    staleTime: 15_000,
  });
}

// ---- Mutations unchanged, but for completeness you can also normalize returns if you read data ----
export function useAddRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) =>
      api.role_matrix_v1_post_createRole({ name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: number) =>
      api.role_matrix_v1_delete_deleteRole(roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rbac', 'roles'] }),
  });
}

export function useAddAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) =>
      api.role_matrix_v1_post_createAction({ name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rbac', 'actions'] }),
  });
}

export function useDeleteAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: number) =>
      api.role_matrix_v1_delete_deleteAction(actionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rbac', 'actions'] }),
  });
}

export function useUpsertGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: { role: string; action: string; entity_type?: string | null; allow: boolean }) =>
      api.role_matrix_v1_put_upsertGrant({
        role: g.role,
        action: g.action,
        entity_type: g.entity_type ?? undefined,
        allow: g.allow,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rbac', 'grants'] }),
  });
}