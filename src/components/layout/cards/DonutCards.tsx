import React from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

type DonutGaugeProps = {
  value: number;          // 0..100
  size?: number;          // px, applied via container
  thickness?: number;     // % of radius, e.g., 12..20
  color?: string;         // any CSS color
  trackColor?: string;
  centerTextColor?: string;
  className?: string;
};

const DonutCards: React.FC<DonutGaugeProps> = ({
  value,
  size = 90,
  thickness = 14,
  color = "#3B82F6",         // Tailwind blue-500
  trackColor = "#E5E7EB",    // gray-200
  centerTextColor = "#0f172a", // slate-900
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, value));

  // Recharts trick: we draw a full 100 track and an overlay arc for value
  const dataTrack = [{ name: "track", value: 100, fill: trackColor }];
  const dataValue = [{ name: "value", value: clamped, fill: color }];

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: "relative" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={dataTrack}
          startAngle={90}
          endAngle={-270} // clockwise
          innerRadius={`${100 - thickness}%`}
          outerRadius="100%"
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" background={{}} cornerRadius={100} />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={dataValue}
            startAngle={90}
            endAngle={90 - (clamped / 100) * 360}
            innerRadius={`${100 - thickness}%`}
            outerRadius="100%"
          >
            <RadialBar dataKey="value" cornerRadius={100} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* center percentage */}
      <div
        className="absolute inset-0 flex items-center justify-center font-semibold"
        style={{ color: centerTextColor }}
      >
        {clamped}%
      </div>
    </div>
  );
};

export default DonutCards;