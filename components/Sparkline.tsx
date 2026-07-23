"use client";

import { PeriodPoint } from "@/lib/setter-types";
import { NumericMetric } from "@/lib/setter-aggregate";
import { Line, LineChart, ResponsiveContainer } from "recharts";

export default function Sparkline({
  points,
  metric,
  color = "#fd3300",
  height = 40,
}: {
  points: PeriodPoint[];
  metric: NumericMetric;
  color?: string;
  height?: number;
}) {
  const data = points.map((p) => ({ value: p[metric] ?? 0 }));
  if (data.every((d) => d.value === 0)) {
    return <div style={{ height }} className="flex items-center text-xs text-ink-faint">No activity</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
