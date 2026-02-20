import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type MiniSparklineProps = {
  data: number[];     // values over time
  width?: number;     // px
  height?: number;    // px
  stroke?: string;    // line color
  fill?: string;      // area color (solid or rgba)
  className?: string;
  withTooltip?: boolean;
};

const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 120,
  height = 40,
  stroke = "#60A5FA", // blue-400
  fill = "rgba(96,165,250,0.2)",
  className,
  withTooltip = false,
}) => {
  const chartData = data.map((y, i) => ({ i, y }));

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          {withTooltip && (
            <Tooltip
              cursor={{ stroke: "rgba(0,0,0,0.05)" }}
              contentStyle={{ fontSize: 12 }}
              formatter={(v) => [v as number, "Value"]}
            />
          )}
          <Area
            dataKey="y"
            type="monotone"
            stroke={stroke}
            strokeWidth={2}
            fill={fill}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniSparkline;
