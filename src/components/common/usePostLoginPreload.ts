import { useCallback } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../../auth/useAuthHydrate";
import { preloadAppData } from "./preload";

/**
 * Returns a function that:
 *  1) Hydrates current user (via useAuthHydrate's refresh)
 *  2) Prefetches app data via React Query
 *  3) Resolves only when all are done
 */
export function usePostLoginPreload() {
  const { refresh } = useUser();           // from your useAuthHydrate.tsx
  const qc: QueryClient = useQueryClient();

  return useCallback(async () => {
    // Step 1: Ensure /auth/me is loaded into UserProvider
    await refresh();

    // Step 2: Preload queries needed for first screen
    await preloadAppData(qc);
  }, [refresh, qc]);
}