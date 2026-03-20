import { type UserUpdate,type UserCreate } from '../../../generated/sdk/models';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getQMSBackend } from '../../../generated/sdk/endpoints';

const api = getQMSBackend();

// If your Orval functions use a different signature (e.g., auth_v1_post_register({ data })),
// uncomment and swap the calls accordingly in the mutationFn lines below.

export function useUserMutations() {
  const qc = useQueryClient();

  const createUser = useMutation({
    mutationFn: async (payload: UserCreate) => {
      // Common signatures:
      // return auth_v1_post_register(payload);
      // return auth_v1_post_register({ data: payload });
      return api.auth_v1_post_register(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async (vars: { id: number; patch: UserUpdate }) => {
      const { id, patch } = vars;
      // Common signatures:
      // return users_v1_patch_updateUser(id, patch);
      // return users_v1_patch_updateUser({ id }, patch);
      // return users_v1_patch_updateUser({ pathParams: { id }, body: patch });
      return api.users_v1_patch_updateUser(id as any, patch as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      // Common signatures:
      // return users_v1_delete_deleteUser(id);
      // return users_v1_delete_deleteUser({ id });
      // return users_v1_delete_deleteUser({ pathParams: { id } });
      return api.users_v1_delete_deleteUser(id as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Helper to delete many users at once
  const deleteMany = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => deleteUser.mutateAsync(id)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    createUser,
    createUserAsync: createUser.mutateAsync,

    updateUser,
    updateUserAsync: updateUser.mutateAsync,

    deleteUser,
    deleteUserAsync: deleteUser.mutateAsync,

    deleteMany,
    deleteManyAsync: deleteMany.mutateAsync,
  };
}
