import React from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQMSBackend } from "../../../generated/sdk/endpoints";
// ⬇️ Change this import path/names to your Orval SDK output

type Trend = "up" | "down" | "flat";


type RecentProjectCreationItem = {
  id : number;
  owner_name?: string | null,
  name: string;
  created_at: string;  // ISO date
  status: string;
};

type RecentProjectCreationsOut = {
  items: RecentProjectCreationItem[];
};

type TopProjectItem = {
  project_id: number;
  project_name: string;
  testcases_total: number;
  testcases_executed: number;
  progress_percent: number;       // e.g. 65.0
  trend: "up" | "down" | "flat";
  updates_in_window: number;
};
type TopProjectsOut = {
  items: TopProjectItem[];
  total: number;
};


function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.valueOf())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function statusPill(status: string) {
  const s = (status || "").toLowerCase();
  if (["active", "completed", "open"].includes(s))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (["pending", "new", "draft"].includes(s))
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (["blocked", "cancelled", "inactive"].includes(s))
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

export default function TableSection() {
  const api = React.useMemo(() => getQMSBackend(), []);

  const {
    data: recentData,
    isLoading: recentLoading,
    isError: recentError,
    error: recentErr,
  } = useQuery({
    queryKey: ["recent-projects", 5],
    queryFn: async () => {
      const res = await api.dashboardanalytics_v1_get_recentProjectCreations({ limit: 5 });
      return res.data as RecentProjectCreationsOut;
    },
  });

  const {
    data: topData,
    isLoading: topLoading,
    isError: topError,
    error: topErr,
  } = useQuery({
    queryKey: ["top-projects", 4, 7],
    queryFn: async () => {
      const res = await api.dashboardanalytics_v1_get_topProjectsByUpdatesWithExecutionProgress({ limit: 4, window_days: 7 });
      return res.data as TopProjectsOut;
    },
  });

  const recentItems = recentData?.items ?? [];
  const topItems = topData?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Recent Project Creations */}
      <div className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Project Creations</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Latest projects created in your workspace
              </p>
            </div>
            <Link to="/workspace/projects?sort=created_at:desc" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {recentLoading ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading…</div>
          ) : recentError ? (
            <div className="p-6 text-sm text-red-600">
              {recentErr instanceof Error ? recentErr.message : "Failed to load"}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600">Project</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600">Owner</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600">Created</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-600" />
                </tr>
              </thead>
              <tbody>
                {recentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-sm text-slate-500 dark:text-slate-400">
                      No recent projects found.
                    </td>
                  </tr>
                ) : (
                  recentItems.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-4">
                        <Link to={`/workspace/projects/${p.id}`} className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-800 dark:text-white">{p.owner_name ?? "—"}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusPill(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-800 dark:text-white">{formatDate(p.created_at as unknown as string)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreHorizontal className="w-4 h-4 text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top Projects */}
      <div className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Top Projects</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Most active projects and their execution progress
              </p>
            </div>
            <Link to="/workspace/projects?sort=activity:desc" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {topLoading ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Loading…</div>
          ) : topError ? (
            <div className="text-sm text-red-600">{topErr instanceof Error ? topErr.message : "Failed to load"}</div>
          ) : topItems.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">No active projects found.</div>
          ) : (
            topItems.map((proj) => {
              const percent = Math.max(0, Math.min(100, proj.progress_percent ?? 0));
              return (
                <div key={proj.project_id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex-1">
                    <Link to={`/workspace/projects/${proj.project_id}`} className="text-sm font-semibold text-slate-800 dark:text-white hover:underline">
                      {proj.project_name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Test cases:{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {proj.testcases_executed}/{proj.testcases_total}
                      </span>{" "}
                      • Updates (last window):{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {proj.updates_in_window}
                      </span>
                    </p>
                    <div className="mt-2 h-2 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          proj.trend === "up" ? "bg-green-500" : proj.trend === "down" ? "bg-red-500" : "bg-slate-400"
                        }`}
                        style={{ width: `${percent}%` }}
                        title={`Progress: ${percent}%`}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center justify-end space-x-1">
                      <TrendIcon trend={proj.trend as Trend} />
                      <span
                        className={`text-sm font-medium ${
                          proj.trend === "up" ? "text-green-600" : proj.trend === "down" ? "text-red-600" : "text-slate-500"
                        }`}
                      >
                        {proj.trend === "up" ? "Up" : proj.trend === "down" ? "Down" : "Flat"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{percent.toFixed(1)}% executed</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}