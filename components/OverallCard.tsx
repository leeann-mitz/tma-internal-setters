"use client";

import { SetterBlock, OverallViewKind } from "@/lib/setter-types";
import { computeTrend, describeViewKind, isConsistentlyDeclining, isConsistentlyImproving, resolveViewPoints } from "@/lib/setter-aggregate";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import PeriodToggle from "./PeriodToggle";
import StatTile from "./StatTile";
import TrendChart from "./TrendChart";
import { AlertTriangle, TrendingUp } from "lucide-react";

export default function OverallCard({
  team,
  kind,
  onKindChange,
}: {
  team: SetterBlock;
  kind: OverallViewKind;
  onKindChange: (k: OverallViewKind) => void;
}) {
  const points = resolveViewPoints(team, kind);
  const setsTrend = computeTrend(points, "sets");
  const declining = isConsistentlyDeclining(points, "sets", 3);
  const improving = isConsistentlyImproving(points, "sets", 3);

  return (
    <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink">Overall Internal Setter Performance</h2>
          <p className="mt-1 text-sm text-ink-soft">Team Philip, all setters combined — {describeViewKind(kind, points)} view</p>
        </div>
        <PeriodToggle value={kind} onChange={onKindChange} />
      </div>

      {(declining || improving) && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${
            declining
              ? "border-status-red/30 bg-status-red/10 text-status-red"
              : "border-status-green/30 bg-status-green/10 text-status-green"
          }`}
        >
          {declining ? <AlertTriangle size={16} /> : <TrendingUp size={16} />}
          {declining
            ? "Sets have declined 3 periods in a row — needs attention."
            : "Sets have risen 3 periods in a row — trending in the right direction."}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Sets" value={formatNumber(setsTrend.current)} trend={setsTrend} />
        <StatTile
          label="Shows"
          value={formatNumber(computeTrend(points, "shows").current)}
          trend={computeTrend(points, "shows")}
        />
        <StatTile
          label="Show Rate"
          value={formatPercent(computeTrend(points, "showRate").current)}
          trend={computeTrend(points, "showRate")}
        />
        <StatTile
          label="Closed Deals"
          value={formatNumber(computeTrend(points, "closedDeal").current)}
          trend={computeTrend(points, "closedDeal")}
        />
        <StatTile
          label="Revenue"
          value={formatCurrency(computeTrend(points, "revenue").current)}
          trend={computeTrend(points, "revenue")}
        />
        <StatTile
          label="Cash Collected"
          value={formatCurrency(computeTrend(points, "cashCollected").current)}
          trend={computeTrend(points, "cashCollected")}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Sets</div>
          <TrendChart points={points} metric="sets" color="#fd3300" valueFormatter={(v) => `${v} sets`} height={140} />
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Shows</div>
          <TrendChart points={points} metric="shows" color="#1d1a1a" valueFormatter={(v) => `${v} shows`} height={140} />
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Show rate</div>
          <TrendChart points={points} metric="showRate" color="#c98a00" valueFormatter={(v) => `${v}%`} height={140} />
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Closed deals</div>
          <TrendChart points={points} metric="closedDeal" color="#1f9d55" valueFormatter={(v) => `${v} closed`} height={140} />
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Revenue</div>
          <TrendChart points={points} metric="revenue" color="#e67e22" valueFormatter={(v) => formatCurrency(v)} height={140} />
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Cash collected</div>
          <TrendChart points={points} metric="cashCollected" color="#db2c00" valueFormatter={(v) => formatCurrency(v)} height={140} />
        </div>
      </div>
    </section>
  );
}
