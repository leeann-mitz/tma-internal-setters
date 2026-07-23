import { LeaderboardData } from "@/lib/setter-types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { Star } from "lucide-react";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function SetterShowdownCard({ leaderboard }: { leaderboard: LeaderboardData }) {
  const ranked = [...leaderboard.rows]
    .filter((r) => r.show != null || r.cashCollected != null)
    .sort((a, b) => (b.cashCollected ?? 0) - (a.cashCollected ?? 0));

  const topBonus = [...leaderboard.rows].sort((a, b) => (b.totalBonus ?? 0) - (a.totalBonus ?? 0))[0];

  return (
    <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink">Setter Showdown</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Cash collected leaderboard — {leaderboard.monthLabel || "this month"}.
          </p>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="mt-4 rounded-lg border border-line bg-surface-soft p-4 text-sm text-ink-soft">
          No leaderboard data available yet.
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-1">
            {ranked.map((row, i) => (
              <div
                key={row.name}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg px-3 py-2 odd:bg-surface-soft"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-7 shrink-0 text-center font-mono text-sm text-ink-soft">
                    {i < 3 ? MEDALS[i] : `${i + 1}.`}
                  </span>
                  <span className="truncate font-serif text-sm font-semibold text-ink">{row.name}</span>
                  {(row.topShow != null || row.topCash != null) && (
                    <Star size={12} className="shrink-0 text-status-amber" />
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3 font-mono text-xs sm:text-sm">
                  <span className="font-semibold text-ink">{formatCurrency(row.cashCollected)}</span>
                  <span className="text-ink-soft">{formatNumber(row.show)} shows</span>
                  <span className="text-ink-soft">{formatPercent(row.conversion != null ? row.conversion : null)}</span>
                  <span className="font-semibold text-brand">{formatCurrency(row.totalBonus)} bonus</span>
                </div>
              </div>
            ))}
          </div>

          {topBonus && (
            <div className="mt-4 rounded-lg border border-brand/30 bg-surface-accent px-4 py-2.5 text-sm text-ink">
              <span className="font-semibold">Top Total Bonus:</span> {topBonus.name} at{" "}
              {formatCurrency(topBonus.totalBonus)}
              {(topBonus.topShow != null || topBonus.topCash != null) && " — also holding a Top Show/Top Cash award."}
            </div>
          )}
        </>
      )}
    </section>
  );
}
