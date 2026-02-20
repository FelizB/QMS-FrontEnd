import React from "react";
import DonutCards from "./DonutCards";
import MiniSparkline from "./MiniSparkline";
import { MoreHorizontal, ArrowUpRight, ArrowDownRight } from "lucide-react";

type KpiCardProps = {
  percentage: number;
  title: string;
  subValue: string;        // e.g., "10%"
  trendUp?: boolean;
  color?: string;          // main accent (donut/spark)
  trackColor?: string;     // donut track
  sparkData: number[];
  className?: string;
};

const KpiCard: React.FC<KpiCardProps> = ({
  percentage,
  title,
  subValue,
  trendUp = true,
  color = "#3B82F6",
  trackColor = "#E5E7EB",
  sparkData,
  className,
}) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className || ""}`}>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <DonutCards
            value={percentage}
            size={88}
            thickness={16}
            color={color}
            trackColor={trackColor}
            centerTextColor="var(--tw-prose-body, #0f172a)"
          />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-slate-800 leading-tight line-clamp-2 dark:text-slate-100">
              {title}
            </div>
          </div>
        </div>
        <button
          className="h-8 w-8 grid place-items-center rounded-md text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom row */}
      <div className="mt-3 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">{subValue}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] ${
              trendUp ? "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            }`}
          >
            {trendUp ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trendUp ? "up" : "down"}
          </span>
        </div>
        <MiniSparkline
          data={sparkData}
          width={118}
          height={38}
          stroke={color}
          fill={`${color}33`} 
        />
      </div>
    </div>
  );
};

export default KpiCard;