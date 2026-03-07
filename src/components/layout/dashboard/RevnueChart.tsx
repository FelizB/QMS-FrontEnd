import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getQMSBackend } from "../../../generated/sdk/endpoints";

type ChartType = "projects" | "dashboard";

/** ===== Types aligned to your APIs ===== */
type ProjectsMonthlyItem = {
  month: number; // 1..12
  month_label: string; // "Jan" etc.
  created: number;
  active_of_created: number;
};
type ProjectMonthlyResponse = {
  year: number;
  items: ProjectsMonthlyItem[];
  total_created?: number;
  total_active_of_created?: number;
};

type MonthlyCreationItem = {
  month: string; // "YYYY-MM"
  portfolios: number;
  programs: number;
  projects: number;
};
type MonthlyCreationsOut = {
  year: number;
  items: MonthlyCreationItem[];
};

const MONTH_LABELS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
] as const;

/** ===== Queries ===== */
function useProjectsMonthly(year: number, enabled: boolean) {
  const api = React.useMemo(() => getQMSBackend(), []);
  return useQuery<ProjectMonthlyResponse>({
    enabled,
    queryKey: ["projects-monthly", year],
    queryFn: async () => {
      const res = await api.projectanalytics_v1_get_getProjectsMonthly({ year });
      return res.data as ProjectMonthlyResponse;
    },
    staleTime: 60_000,
  });
}

function useCreationMonthly(year: number, enabled: boolean) {
  const api = React.useMemo(() => getQMSBackend(), []);
  return useQuery<MonthlyCreationsOut>({
    enabled,
    queryKey: ["dashboard-trends", year],
    queryFn: async () => {
      // ✅ pass year
      const res = await api.dashboardanalytics_v1_get_monthlyCreationsOfPortfoliosProgramsProjects({ year });
      return res.data as MonthlyCreationsOut;
    },
    staleTime: 60_000,
  });
}

/** ===== Component ===== */
export default function MonthlyTrendsChart() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = React.useState<number>(currentYear);
  const [chartType, setChartType] = React.useState<ChartType>("projects");

  const {
    data: projData,
    isLoading: projLoading,
    isFetching: projFetching,
    error: projError,
  } = useProjectsMonthly(year, chartType === "projects");

  const {
    data: dashData,
    isLoading: dashLoading,
    isFetching: dashFetching,
    error: dashError,
  } = useCreationMonthly(year, chartType === "dashboard");

  // Only show loading state for the visible chart type
  const isLoading = chartType === "projects" ? projLoading : dashLoading;
  const isFetching = chartType === "projects" ? projFetching : dashFetching;
  const error = (chartType === "projects" ? projError : dashError) as Error | null;

  // Build a 12-month base array and merge API results
  const chartData = React.useMemo(() => {
    const base = MONTH_LABELS.map((label, idx) => ({
      month: label,
      // Projects view
      created: 0,
      active: 0,
      // Dashboard view
      portfolios: 0,
      programs: 0,
      projects: 0,
      _monthNum: idx + 1, // 1..12
    }));

    if (chartType === "projects" && projData?.items?.length) {
      for (const it of projData.items) {
        const idx = it.month - 1; // 1..12 -> 0..11
        if (idx >= 0 && idx < 12) {
          base[idx].created = it.created ?? 0;
          base[idx].active = it.active_of_created ?? 0;
        }
      }
    }

    if (chartType === "dashboard" && dashData?.items?.length) {
      for (const it of dashData.items) {
        // "YYYY-MM" -> extract MM
        const mm = Number(String(it.month).split("-")[1]);
        const idx = mm - 1;
        if (Number.isFinite(idx) && idx >= 0 && idx < 12) {
          base[idx].portfolios = it.portfolios ?? 0;
          base[idx].programs = it.programs ?? 0;
          base[idx].projects = it.projects ?? 0;
        }
      }
    }

    return base;
  }, [chartType, projData, dashData]);

  const years = React.useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - i),
    [currentYear]
  );

  return (
    <div className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 relative">
      {/* Header + selectors */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Monthly Trends
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {chartType === "projects"
              ? "Projects created vs active (by month)"
              : "Monthly creations: Portfolios, Programs, Projects"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Chart type segmented buttons */}
          <div className="inline-flex rounded-2xl border border-slate-200 dark:border-slate-700 p-1">
            <button
              className={`px-3 py-1.5 text-sm rounded-xl transition ${
                chartType === "projects"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={() => setChartType("projects")}
            >
              Project Summary
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-xl transition ${
                chartType === "dashboard"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={() => setChartType("dashboard")}
            >
              Portfolio Summary
            </button>
          </div>

          {/* Year select */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        {chartType === "projects" ? (
          <>
            <LegendPill colorClass="from-blue-500 to-purple-600" label="Created" />
            <LegendPill colorClass="from-emerald-400 to-emerald-600" label="Active" />
          </>
        ) : (
          <>
            <LegendPill colorClass="from-violet-500 to-fuchsia-600" label="Portfolios" />
            <LegendPill colorClass="from-blue-500 to-cyan-500" label="Programs" />
            <LegendPill colorClass="from-amber-500 to-orange-600" label="Projects" />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                color: "black",
              }}
              formatter={(value: any, name?: string) => [value as number, name ?? ""]}
              labelFormatter={(label) => `Month: ${label}`}
            />

            {chartType === "projects" ? (
              <>
                <Bar
                  dataKey="created"
                  name="Created"
                  fill="url(#createdGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="active"
                  name="Active"
                  fill="url(#activeGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="portfolios"
                  name="Portfolios"
                  fill="url(#portfoliosGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="programs"
                  name="Programs"
                  fill="url(#programsGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="projects"
                  name="Projects"
                  fill="url(#projectsGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </>
            )}

            {/* Gradients */}
            <defs>
              {/* Projects view */}
              <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              {/* Dashboard view */}
              <linearGradient id="portfoliosGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
              <linearGradient id="programsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="projectsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
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
          {error.message ?? "Failed to load data."}
        </div>
      )}
    </div>
  );
}

function LegendPill({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 bg-gradient-to-r ${colorClass} rounded-full`} />
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
    </div>
  );
}