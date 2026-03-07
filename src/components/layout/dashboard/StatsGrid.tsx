import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Eye, PanelsTopLeft, Users, Proportions } from "lucide-react";
import { getQMSBackend } from "../../../generated/sdk/endpoints";

type Trend = "up" | "down" | "flat";

type EntitySummary = {
  total_active: number;
  current_month?: number;
  previous_month?: number;
  change_pct?: number | null;
  trend: Trend;
  change_label: string;
};

type DashboardSummary = {
  as_of?: string;
  period?: { year?: number; month?: number };
  portfolios: EntitySummary;
  programs: EntitySummary;
  projects: EntitySummary;
  users: EntitySummary;
};

function useDashboardSummary() {
  const api = getQMSBackend();
  const year = new Date().getFullYear();

  return useQuery({
    queryKey: ["dashboard-summary", year],
    queryFn: async () => {
      const res = await api.dashboardanalytics_v1_get_dashboardSummaryTotalsMonthlyDeltas();
      return res.data as DashboardSummary;
    },
    staleTime: 60_000,
  });
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

function formatDelta(n?: number) {
  if (n === undefined || n === null) return "— this month";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n} this month`;
}

const baseStats = [
  {
    title: "Total Portfolios",
    icon: Proportions,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Total Programs",
    icon: PanelsTopLeft,
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    title: "Total Projects",
    icon: Eye,
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  {
    title: "Active Users",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-600 dark:text-blue-400",
  },
] as const;

function widthFromChange(trend: Trend, change_pct?: number | null) {
  if (change_pct === null || change_pct === undefined) {
    return trend === "up" ? "70%" : trend === "down" ? "40%" : "55%";
  }
  const pct = Math.min(100, Math.max(10, Math.round(Math.abs(change_pct))));
  return `${pct}%`;
}

function StatsGrid() {
  const { data, isLoading, isError } = useDashboardSummary();

  const d = data ?? ({
    portfolios: { total_active: 0, trend: "flat", change_label: "0%" },
    programs: { total_active: 0, trend: "flat", change_label: "0%" },
    projects: { total_active: 0, trend: "flat", change_label: "0%" },
    users: { total_active: 0, trend: "flat", change_label: "0%" },
  } as DashboardSummary);

  const entities = [d.portfolios, d.programs, d.projects, d.users];

  const computedStats = baseStats.map((base, idx) => {
    const entity = entities[idx]!;
    return {
      ...base,
      value: isLoading ? "…" : formatNumber(entity.total_active ?? 0),
      sublabel: isLoading ? "…" : formatDelta(entity.current_month),
      trend: entity.trend,
      change: entity.change_label ?? "0%",
      changePct: entity.change_pct ?? null,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {computedStats.map((stat, index) => (
        <div
          className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 group"
          key={index}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                {stat.title}
              </p>

              {/* Main total */}
              <p className="text-3xl font-bold text-slate-800 dark:text-white">
                {stat.value}
              </p>

              {/* Sub label: current month */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stat.sublabel}
              </p>

              {/* Trend & change label */}
              <div className="flex items-center space-x-2 mt-3">
                {stat.trend === "up" ? (
                  <ArrowRight className="w-4 h-4 text-green-500 transform -rotate-45" />
                ) : stat.trend === "down" ? (
                  <ArrowRight className="w-4 h-4 text-red-500 transform rotate-45" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-0" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    stat.trend === "up"
                      ? "text-green-500"
                      : stat.trend === "down"
                      ? "text-red-500"
                      : "text-slate-500"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-blue-500 dark:text-blue-400">
                  vs last month
                </span>
              </div>
            </div>

            <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-all duration-300`}>
              {<stat.icon className={`w-6 h-6 ${stat.textColor}`} />}
            </div>
          </div>

          {/* Progressbar */}
          <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-300`}
              style={{ width: widthFromChange(stat.trend as Trend, stat.changePct as number | null) }}
            />
          </div>
        </div>
      ))}

      {isError && (
        <div className="col-span-full text-sm text-red-500">
          Failed to load dashboard summary.
        </div>
      )}
    </div>
  );
}

export default StatsGrid;