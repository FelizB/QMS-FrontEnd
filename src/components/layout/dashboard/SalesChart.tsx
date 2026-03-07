import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getQMSBackend } from "../../../generated/sdk/endpoints";

/** ===== Types aligned to API ===== */
export interface StatusCountItem {
  status: string;
  count: number;
}

type ProjectStatusCountsOut = {
  total: number;
  items: StatusCountItem[];
};

/** ===== Utilities ===== */

// Categorical palette (extend as needed)
const BASE_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#14b8a6", "#e879f9", "#f97316", "#22c55e", "#06b6d4",
  "#a78bfa", "#84cc16", "#f43f5e", "#0ea5e9", "#fb923c",
];

// Deterministic color by status (stable across renders)
function colorForStatus(status: string) {
  let hash = 0;
  for (let i = 0; i < status.length; i++) {
    hash = (hash << 5) - hash + status.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % BASE_COLORS.length;
  return BASE_COLORS[idx];
}

/** ===== Query ===== */
function useProjectsByStatus() {
  const api = React.useMemo(() => getQMSBackend(), []);
  return useQuery<ProjectStatusCountsOut>({
    queryKey: ["projects-by-status"],
    queryFn: async () => {
      // Endpoint has no params
      const res = await api.projectanalytics_v1_get_countsOfProjectsByStatus();
      return res.data as ProjectStatusCountsOut;
    },
    staleTime: 60_000,
  });
}

/** ===== Component ===== */
export default function ProjectsByStatusPie({
  title = "Projects by Status",
  subtitle = "Distribution",
}: {
  title?: string;
  subtitle?: string;
}) {
  const { data, isLoading, isFetching, error } = useProjectsByStatus();

  // Normalize to Recharts shape: { name, value, color, pct }
  const chartData = React.useMemo(() => {
    const items: StatusCountItem[] = data?.items ?? [];
    // Prefer backend total if provided and valid; fall back to sum of counts
    const total =
      typeof data?.total === "number" && data.total >= 0
        ? data.total
        : items.reduce((sum, it) => sum + (it.count ?? 0), 0);

    return items.map((it) => ({
      name: it.status,
      value: it.count ?? 0,
      color: colorForStatus(it.status),
      pct: total > 0 ? ((it.count ?? 0) / total) * 100 : 0,
    }));
  }, [data]);

  const totalCount = React.useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData]
  );

  return (
    <div className="bg-white shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 relative">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                color: "black",
              }}
              formatter={(value: any, name?: string) => {
                const item = chartData.find((d) => d.name === name);
                const pct = item ? `${item.pct.toFixed(1)}%` : "";
                return [`${value} (${pct})`, name ?? ""];
              }}
              labelFormatter={() => `Total: ${totalCount}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-3">
        {chartData.length === 0 && !isLoading && !isFetching && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            No data available.
          </div>
        )}

        {chartData.map((item, index) => (
          <div className="flex items-center justify-between" key={index}>
            <div className="flex items-center space-x-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {item.name}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-white">
              {item.pct.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] rounded-b-2xl flex items-center justify-center pointer-events-none">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-slate-400 border-t-transparent" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-3 text-sm text-red-600">
          {(error as any).message ?? "Failed to load data."}
        </div>
      )}
    </div>
  );
}
