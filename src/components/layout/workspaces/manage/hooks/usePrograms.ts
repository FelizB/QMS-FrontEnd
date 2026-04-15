import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getQMSBackend } from "../../../../../generated/sdk/endpoints";
import type {
  ProgramCreate,
  ProgramOut,
  ProgramPagedResult,
  ProgramUpdate,
} from "../../../../../generated/sdk/models";


function normalizeError(e: any) {
  const status = e?.response?.status;
  const data = e?.response?.data;

  if (status) {
    const msg = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return new Error(`HTTP ${status}: ${msg}`);
  }

  return new Error(e?.message ?? "Unknown error");
}

export type ProgramListParams = {
  page?: number;
  page_size?: number;
  q?: string;
  is_default?: boolean;
  is_active?: boolean;
  project_template_id?: number;
};

export function usePrograms(params: ProgramListParams) {
  const page = params.page ?? 1;
  const page_size = params.page_size ?? 20;
  const q = params.q ?? undefined;

  const skip = (page - 1) * page_size;
  const limit = page_size;

  return useQuery({
    queryKey: ["programs", { page, page_size, q }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const api = getQMSBackend();

        const res = await api.programs_v1_get_listAllPrograms({
          skip,
          limit,
          q,
        });

        return (res.data ?? res) as ProgramPagedResult;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: 30_000,
  });
}

export function useProgram(id?: number) {
  return useQuery({
    queryKey: ["program", id],
    enabled: !!id,
    queryFn: async () => {
      try {
        const api = getQMSBackend();

        const res = await api.programs_v1_get_getProgram(id as number);
        return (res.data ?? res) as ProgramOut;
      } catch (e) {
        throw normalizeError(e);
      }
    },
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProgramCreate) => {
      try {
        const api = getQMSBackend();

        const res = await api.programs_v1_post_createProgramForPortfolio(
          payload.portfolio_id,
          payload
        );

        return res.data ?? res;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ProgramUpdate }) => {
      try {
        const api = getQMSBackend();

        const res = await api.programs_v1_patch_updateProgram(id, payload);
        return res.data ?? res;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: ["programs"] });
      await qc.invalidateQueries({ queryKey: ["program", variables.id] });
    },
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      concurrency_guid,
    }: {
      id: number;
      concurrency_guid: string;
    }) => {
      try {
        const api = getQMSBackend();

        await api.programs_v1_delete_deleteProgram(id, {
          concurrency_guid,
        });
      } catch (e) {
        throw normalizeError(e);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}