"use client";

import { SetterBlock, OverallViewKind, PeriodPoint } from "@/lib/setter-types";
import { bottomTierRanks, describeViewKind, rankActiveReps, resolveViewPoints } from "@/lib/setter-aggregate";
import { formatNumber, formatPercent, rateClass } from "@/lib/format";
import { Crown, TrendingDown } from "lucide-react";

function RepGroup({
  label,
  icon,
  accent,
  members,
}: {
  label: string;
  icon: React.ReactNode;
  accent: string;
  members: { name: string; point: PeriodPoint }[];
}) {
  return (
    <div className={`flex-1 rounded-lg border p-4 ${accent}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {icon}
        {label}
        {members.length > 1 && <span className="normal-case text-ink-faint">(tied)</span>}
      </div>
      <div className="mt-2 space-y-2">
        {members.map(({ name, point }) => (
          <div key={name} className="flex items-center justify-between gap-2">
            <div className="font-serif text-sm font-semibold text-ink">{name}</div>
            <div className="flex items-baseline gap-3 font-mono text-sm text-ink">
              <span className="font-semibold">{formatNumber(point.sets)} sets</span>
              <span className="text-ink-soft">{formatNumber(point.shows)} shows</span>
              <span className={rateClass(point.showRate) || "text-ink-soft"}>{formatPercent(point.showRate)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopBottomCard({ reps, kind }: { reps: SetterBlock[]; kind: OverallViewKind }) {
  // Ranked by Sets (not show rate or deal volume) among reps who actually
  // had sets/shows that period — see rankActiveReps for why a true 0 is
  // kept distinct from simply having no activity. Ties share a rank.
  const ranked = rankActiveReps(reps, kind, "sets");
  const top = ranked.filter((r) => r.rank === 1);
  const bottomRanks = bottomTierRanks(ranked, 2);
  const bottom = ranked.filter((r) => bottomRanks.has(r.rank) && r.rank !== 1);
  const viewLabel = describeViewKind(kind, reps[0] ? resolveViewPoints(reps[0], kind) : []);

  return (
    <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
      <h2 className="font-serif text-xl font-semibold text-ink">Top &amp; Bottom Rep</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Ranked by Sets — {viewLabel} view, among reps with activity that period.
      </p>
      {ranked.length === 0 ? (
        <div className="mt-4 rounded-lg border border-line bg-surface-soft p-4 text-sm text-ink-soft">
          No rep had any sets or shows in this period yet.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          {top.length > 0 && (
            <RepGroup
              label="Top Rep"
              members={top.map((r) => ({ name: r.rep.name, point: r.point }))}
              icon={<Crown size={14} className="text-status-green" />}
              accent="border-status-green/30 bg-status-green/5"
            />
          )}
          {bottom.length > 0 && (
            <RepGroup
              label="Bottom by Sets"
              members={bottom.map((r) => ({ name: r.rep.name, point: r.point }))}
              icon={<TrendingDown size={14} className="text-status-red" />}
              accent="border-status-red/30 bg-status-red/5"
            />
          )}
        </div>
      )}
    </section>
  );
}
