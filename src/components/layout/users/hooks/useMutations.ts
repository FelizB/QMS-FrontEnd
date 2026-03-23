import { getQMSBackend } from "../../../../generated/sdk/endpoints";
import { useApi } from "../../../../lib/errors/useApi";

export function useUserMutations() {
  const api = getQMSBackend();

  // VALID — because fn accepts (id: number)
  const { run, loading } = useApi(async (id: number) => {
    return api.users_v1_delete_deleteUser(id);
  });

  async function deleteManyAsync(ids: number[]) {
    for (const id of ids) {
      const result = await run(id);
      if (!result.ok) {
        throw new Error(result.error?.userMessage || `Failed to delete user ${id}`);
      }
    }
    return true;
  }

  return {
    deleteManyAsync,
    deletingMany: loading,
  };
}