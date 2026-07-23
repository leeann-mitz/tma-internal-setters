"use client";

import { RepSummary, SetterBlock, OverallViewKind } from "@/lib/setter-types";
import { evaluateRepFlags, latestPoint, resolveViewPoints, worstFlagLevel } from "@/lib/setter-aggregate";
import { formatCurrency, formatNumber, formatPercent, rateClass } from "@/lib/format";
import FlagBadge from "./FlagBadge";
import Sparkline from "./Sparkline";
import { ArrowDown, Crown } from "lucide-react";

const BORDER_BY_LEVEL: Record<string, string> = {
  red: "border-t-status-red",
  amber: "border-t-status-amber",
  green: "border-t-status-green",
  gray: "border-t-line",
};

export default function RepCard({
  rep,
  team,
  kind,
  rank,
  tied = false,
  totalActive,
  isTop = false,
  isBottom = false,
  isInactive = false,
  summary,
  onClick,
}: {
  rep: SetterBlock;
  team: SetterBlock;
  kind: OverallViewKind;
  rank?: number;
  tied?: boolean;
  totalActive?: number;
  isTop?: boolean;
  isBottom?: boolean;
  isInactive?: boolean;
  summary?: RepSummary | null;
  onClick?: () => void;
}) {
  const point = latestPoint(resolveViewPoints(rep, kind));
  const flags = evaluateRepFlags(rep, team);
  const level = worstFlagLevel(flags);

  if (isInactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-line border-t-4 border-t-line bg-surface-soft p-4 text-left opacity-70 shadow-sm transition-shadow hover:opacity-100 hover:shadow-md"
      >
        <h3 className="font-serif text-base font-semibold text-ink">{rep.name}</h3>
        <div className="mt-2 text-xs text-ink-soft">No sets or shows this period. Click for call QA.</div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border border-line border-t-4 bg-surface p-4 text-left shadow-sm transition-shadow hover:shadow-md ${BORDER_BY_LEVEL[level]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-base font-semibold text-ink">{rep.name}</h3>
        {rank != null && (
          <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-soft">
            {tied ? "T-" : "#"}{rank}{totalActive ? ` / ${totalActive}` : ""}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {isTop && (
          <span className="inline-flex items-center gap-1 rounded-full border border-status-green/30 bg-status-green/10 px-2 py-0.5 text-xs font-medium text-status-green">
            <Crown size={11} /> Top by sets
          </span>
        )}
        {isBottom && (
          <span className="inline-flex items-center gap-1 rounded-full border border-status-red/30 bg-status-red/10 px-2 py-0.5 text-xs font-medium text-status-red">
            <ArrowDown size={11} /> Bottom by sets
          </span>
        )}
        {flags.map((f, i) => (
          <FlagBadge key={i} flag={f} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="font-mono text-lg font-semibold text-ink">{formatNumber(point?.sets ?? null)}</div>
          <div className="text-[11px] text-ink-soft">Sets</div>
        </div>
        <div>
          <div className="font-mono text-lg font-semibold text-ink">{formatNumber(point?.shows ?? null)}</div>
          <div className="text-[11px] text-ink-soft">Shows</div>
        </div>
        <div>
          <div className={`font-mono text-lg font-semibold text-ink ${rateClass(point?.showRate ?? null)}`}>
            {formatPercent(point?.showRate ?? null)}
          </div>
          <div className="text-[11px] text-ink-soft">Show Rate</div>
        </div>
      </div>

      <div className="mt-3">
        <Sparkline points={rep.weekly} metric="sets" />
        <div className="text-center text-[10px] text-ink-faint">Weekly sets trend</div>
      </div>

      {summary && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-center">
          <div>
            <div className="font-mono text-sm font-semibold text-ink">{formatCurrency(summary.revenue)}</div>
            <div className="text-[10px] text-ink-soft">Revenue ({summary.monthLabel})</div>
          </div>
          <div>
            <div className="font-mono text-sm font-semibold text-ink">{formatCurrency(summary.netCashCollected)}</div>
            <div className="text-[10px] text-ink-soft">Net Cash Collected</div>
          </div>
        </div>
      )}
    </button>
  );
}
