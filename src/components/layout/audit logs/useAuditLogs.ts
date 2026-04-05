import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ActivityLogOut, PagedActivityLogOut } from "../../../generated/sdk/models";
import { getQMSBackend } from "../../../generated/sdk/endpoints";

type ListParams = {
  org_id?: number;
  q?: string;
  entity_type?: string;
  action?: string;
  outcome?: string;
  actor_id?: number;
  from_dt?: string;
  to_dt?: string;
  page?: number;
  page_size?: number;
};

function cleanParams<T extends Record<string, any>>(params: T): T {
  const out: any = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}

export function useAuditLogs(params: ListParams) {
  const cleaned = cleanParams({ page: 1, page_size: 20, ...params });

  return useQuery<PagedActivityLogOut>({
    queryKey: ["auditLogs", cleaned],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const api = getQMSBackend();

      // ✅ PASS QUERY PARAMS DIRECTLY (NO {params: ...}, NO signal)
      const res = await api.auditlogs_v1_get_listAuditLogs(cleaned as any);
      return res.data as PagedActivityLogOut;
    },
    staleTime: 30_000,
  });
}

export function useAuditLogDetail(id: number | null, org_id?: number) {
  const cleaned = cleanParams({ org_id });

  return useQuery<ActivityLogOut>({
    queryKey: ["auditLog", id, cleaned],
    enabled: !!id,
    queryFn: async () => {
      const api = getQMSBackend();

      // If detail also expects params object, use the same style:
      const res = await api.auditlogs_v1_get_getAuditLog(id as number, cleaned as any);
      return res.data as ActivityLogOut;
    },
    staleTime: 30_000,
  });
}

