import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface RechartProps {
  data: Array<{
    username: string;
    value: number;
    color: string;
  }>;
  isDroppedGames?: boolean;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      originalValue?: number;
      value?: number;
      color: string;
    };
    value?: number;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload[0]) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-black border border-white rounded px-2 py-1 text-sm">
      <div className="text-primary">
        {data.name}: {data.originalValue ?? data.value}
      </div>
    </div>
  );
};

function Rechart({ data, isDroppedGames = false, className }: RechartProps) {
  // Transform data for Recharts format
  const chartData = data.map((item) => ({
    name: item.username,
    value: item.value,
    originalValue: item.value,
    color: item.color,
  }));

  // Handle data inversion for dropped games
  const processedData = isDroppedGames
    ? chartData.map((item) => {
        const maxValue = Math.max(...chartData.map((d) => d.value));
        return {
          ...item,
          value: item.value === 0 ? maxValue + 1 : maxValue - item.value + 1,
        };
      })
    : chartData;

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      className={cn("w-full h-full", className)}
    >
      <BarChart
        data={processedData}
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.3}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: "var(--dynamic-muted)", fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fill: "var(--dynamic-muted)", fontSize: 11 }}
          tickFormatter={(value) => (isDroppedGames ? "" : value.toString())}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {processedData.map((entry) => (
            <Cell
              key={`cell-${entry.name}-${entry.value}`}
              fill={entry.color}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default memo(Rechart);
