"use client";

import { RepSummary, SetterBlock, OverallViewKind } from "@/lib/setter-types";
import { bottomTierRanks, describeViewKind, inactiveReps, rankActiveReps, resolveViewPoints } from "@/lib/setter-aggregate";
import RepCard from "./RepCard";

export default function RepGrid({
  reps,
  team,
  kind,
  repSummaries,
  onSelectRep,
}: {
  reps: SetterBlock[];
  team: SetterBlock;
  kind: OverallViewKind;
  repSummaries: RepSummary[];
  onSelectRep: (repName: string) => void;
}) {
  // Ranked by Sets, best to worst, among reps with activity that period —
  // Sets is a setter's own craft/output metric (unlike Closer's revenue
  // ranking, setters don't have a per-rep revenue time series to rank by).
  // Ties share a rank rather than one arbitrarily outranking the other.
  const ranked = rankActiveReps(reps, kind, "sets");
  const idle = inactiveReps(reps, kind);
  const viewLabel = describeViewKind(kind, reps[0] ? resolveViewPoints(reps[0], kind) : []);
  const total = ranked.length;
  const bottomRanks = bottomTierRanks(ranked, 2);
  const summaryByName = new Map(repSummaries.map((s) => [s.name, s]));

  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-ink">Per-Rep Performance</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Ranked by Sets, best to worst — {viewLabel} view. &quot;This month&quot; box shows the Executive Summary&apos;s
        current-month revenue/cash collected snapshot, independent of the period toggle above.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ranked.map(({ rep, rank, tied }) => (
          <RepCard
            key={rep.name}
            rep={rep}
            team={team}
            kind={kind}
            rank={rank}
            tied={tied}
            totalActive={total}
            isTop={rank === 1}
            isBottom={bottomRanks.has(rank) && rank !== 1}
            summary={summaryByName.get(rep.name) ?? null}
            onClick={() => onSelectRep(rep.name)}
          />
        ))}
        {idle.map((rep) => (
          <RepCard
            key={rep.name}
            rep={rep}
            team={team}
            kind={kind}
            isInactive
            summary={summaryByName.get(rep.name) ?? null}
            onClick={() => onSelectRep(rep.name)}
          />
        ))}
      </div>
    </section>
  );
}
