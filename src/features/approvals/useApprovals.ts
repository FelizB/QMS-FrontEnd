// src/features/approvals/useApprovals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQMSBackend } from '../../generated/sdk/endpoints';

const api = getQMSBackend();
export function useApprovals(filters?: { status?: string; entity_type?: string }) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['approvals', filters ?? {}],
    queryFn: () => api.approvals_v1_get_listPendingApprovals(filters as any),
    staleTime: 15_000,
  });

  const approve = useMutation({
    mutationFn: (id: number) => api.approvals_v1_post_approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  });

  const reject = useMutation({
    mutationFn: (vars: { id: number; reason?: string }) =>
      api.approvals_v1_post_reject(vars.id, { reason: vars.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  });

  return { list, approve, reject };
}