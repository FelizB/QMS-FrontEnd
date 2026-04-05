import * as React from "react";
import { getQMSBackend } from "../../../../generated/sdk/endpoints";

export type RoleRef = { id: number; name: string };

type ReferenceData = {
  roles: RoleRef[];
  departments: string[];
  units: string[];
};

type UseReferenceDataResult = ReferenceData & {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
};

/**
 * ==========================
 * Module-level in-memory cache
 * ==========================
 * This persists across component mounts as long as the page isn't refreshed.
 */

// Change this to 0 if you never want TTL (infinite cache until manual refetch/clear)
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let cache: {
  data: ReferenceData | null;
  fetchedAt: number;
  inflight: Promise<ReferenceData> | null;
} = {
  data: null,
  fetchedAt: 0,
  inflight: null,
};

function isCacheValid() {
  if (!cache.data) return false;
  if (CACHE_TTL_MS <= 0) return true; // infinite
  return Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

function normalizeError(err: any): string {
  const msg =
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    "Failed to load reference data";
  return typeof msg === "string" ? msg : JSON.stringify(msg);
}

/**
 * Helper to unwrap Orval responses (often AxiosResponse with `.data`)
 */
function unwrapData<T = any>(resp: any): T {
  return (resp as any)?.data ?? resp;
}

/**
 * Helper to normalize lists that could come back as:
 * - string[]
 * - { items: string[] }
 * - { items: [{name:"IT"}] }
 * - [{name:"IT"}]
 */
function normalizeStringList(raw: any): string[] {
  const data = raw?.items ?? raw;

  if (!Array.isArray(data)) return [];

  return data.map((x: any) => {
    if (typeof x === "string") return x;
    return x?.name ?? x?.code ?? x?.label ?? String(x);
  });
}

function normalizeRoles(raw: any): RoleRef[] {
  const data = raw?.items ?? raw;

  if (!Array.isArray(data)) return [];

  return data
    .map((x: any) => ({
      id: Number(x?.id),
      name: String(x?.name ?? x?.role_name ?? x?.label ?? ""),
    }))
    .filter((r) => Number.isFinite(r.id) && r.name.length > 0);
}

/**
 * Fetch function that:
 * - uses inflight promise to dedupe concurrent calls
 * - stores cache.data + cache.fetchedAt
 */
async function fetchReferenceData(): Promise<ReferenceData> {
  if (isCacheValid() && cache.data) {
    return cache.data;
  }

  // If a fetch is already running, await it
  if (cache.inflight) {
    return cache.inflight;
  }

  const api = getQMSBackend();

  cache.inflight = (async () => {
    // 🔁 Replace these with your exact Orval-generated methods
    const [rolesResp, deptsResp, unitsResp] = await Promise.all([
      api.role_matrix_v1_get_listRoles(),              // <-- swap name if different
      api.enums_v1_get_listEnum("department"),        // <-- swap name if different
      api.enums_v1_get_listEnum("unit"),              // <-- swap name if different
    ]);

    const rolesRaw = unwrapData(rolesResp);
    const deptsRaw = unwrapData(deptsResp);
    const unitsRaw = unwrapData(unitsResp);

    const data: ReferenceData = {
      roles: normalizeRoles(rolesRaw),
      departments: normalizeStringList(deptsRaw),
      units: normalizeStringList(unitsRaw),
    };

    cache.data = data;
    cache.fetchedAt = Date.now();
    return data;
  })();

  try {
    return await cache.inflight;
  } finally {
    cache.inflight = null;
  }
}

/**
 * Exposed cache utilities (optional but handy)
 */
export function clearReferenceDataCache() {
  cache = { data: null, fetchedAt: 0, inflight: null };
}

export function useReferenceData(): UseReferenceDataResult {
  const [roles, setRoles] = React.useState<RoleRef[]>(cache.data?.roles ?? []);
  const [departments, setDepartments] = React.useState<string[]>(
    cache.data?.departments ?? []
  );
  const [units, setUnits] = React.useState<string[]>(cache.data?.units ?? []);

  const [loading, setLoading] = React.useState(!isCacheValid());
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      clearReferenceDataCache();
      const data = await fetchReferenceData();
      setRoles(data.roles);
      setDepartments(data.departments);
      setUnits(data.units);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isCacheValid()) {
      refetch();
    }
  }, [refetch]);

  return {
    roles,
    departments,
    units,
    loading,
    error,
    refetch,
    clearCache: clearReferenceDataCache,
  };
}
