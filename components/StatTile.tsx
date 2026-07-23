import { TrendResult } from "@/lib/setter-aggregate";
import { formatDelta } from "@/lib/format";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

export default function StatTile({
  label,
  value,
  trend,
  goodDirection = "up",
}: {
  label: string;
  value: string;
  trend?: TrendResult;
  /** Which direction counts as "good" for coloring the delta (up for volume/rate metrics). */
  goodDirection?: "up" | "down";
}) {
  const direction = trend?.direction;
  const isGood =
    direction === "up" ? goodDirection === "up" : direction === "down" ? goodDirection === "down" : null;

  return (
    <div className="rounded-lg border-t-2 border-t-brand bg-surface-accent p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold text-ink">{value}</div>
      {trend && trend.direction !== "insufficient" && (
        <div
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${
            isGood === true ? "text-status-green" : isGood === false ? "text-status-red" : "text-ink-soft"
          }`}
        >
          {direction === "up" && <ArrowUp size={12} />}
          {direction === "down" && <ArrowDown size={12} />}
          {direction === "flat" && <ArrowRight size={12} />}
          <span>{formatDelta(trend.deltaPct)} vs prior period</span>
        </div>
      )}
    </div>
  );
}
