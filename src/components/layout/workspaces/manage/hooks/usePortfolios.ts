// src/hooks/usePortfolios.ts
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getQMSBackend } from "../../../../../generated/sdk/endpoints";
import type{ PortfolioPagedResult } from "../../../../../generated/sdk/models";

export type PortfolioListParams = {
  page?: number;
  page_size?: number;

  // Filters (align these names with your backend query params)
  q?: string;                 // name search
  is_default?: boolean;       // default filter
  is_active?: boolean;        // active filter
  templates?: string[];       // template multi-select
};

function cleanParams<T extends Record<string, any>>(params: T): T {
  const out: any = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    if (Array.isArray(v) && v.length === 0) return;
    out[k] = v;
  });
  return out;
}

function normalizeError(e: any) {
  const status = e?.response?.status;
  const data = e?.response?.data;
  if (status) {
    const msg = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return new Error(`HTTP ${status}: ${msg}`);
  }
  return new Error(e?.message ?? "Unknown error");
}

export function usePortfolios(params: PortfolioListParams) {
  const cleaned = cleanParams({ page: 1, page_size: 20, ...params });

  return useQuery<PortfolioPagedResult, Error>({
    queryKey: ["portfolios", cleaned],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const api = getQMSBackend();

        /**
         * Preferred: Orval method that accepts query params object directly.
         * This prevents params[page] nesting issues.
         *
         * You said: api.getPortfolioList(params)
         * If yours is different casing (getportfoliolist), change here.
         */
        const res = await api.portfolios_v1_get_listPortfolios(cleaned);

        // Orval usually returns AxiosResponse
        return (res.data ?? res) as PortfolioPagedResult;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: 30_000,
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (id: number) => {
      try {
        const api = getQMSBackend();

        /**
         * Orval delete method.
         * Replace with your actual name if different.
         * Examples:
         *  - api.deletePortfolio(id)
         *  - api.deletePortfolioById(id)
         *  - api.portfolio_v1_delete_deletePortfolio(id)
         */
        await (api as any).deletePortfolio(id);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
}

export function useDeletePortfoliosBulk() {
  const qc = useQueryClient();

  return useMutation<void, Error, number[]>({
    mutationFn: async (ids: number[]) => {
      try {
        const api = getQMSBackend();
        // Sequential is safest unless you have a bulk endpoint
        for (const id of ids) {
          await (api as any).deletePortfolio(id);
        }
      } catch (e) {
        throw normalizeError(e);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
}