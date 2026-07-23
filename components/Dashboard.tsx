"use client";

import { useState } from "react";
import { LeaderboardData, OverallViewKind, SetterTrendData } from "@/lib/setter-types";
import OverallCard from "./OverallCard";
import SetterShowdownCard from "./SetterShowdownCard";
import TopBottomCard from "./TopBottomCard";
import RepGrid from "./RepGrid";

export default function Dashboard({
  data,
  leaderboard,
}: {
  data: SetterTrendData;
  leaderboard: LeaderboardData;
}) {
  const [kind, setKind] = useState<OverallViewKind>("weekly");
  const updated = new Date(data.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-header px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-serif text-xl font-semibold text-header-ink">TMA Internal Setters</h1>
            <p className="text-xs text-header-ink-soft">Performance Golf — Transformation Academy, Team Philip</p>
          </div>
          <div className="text-right text-xs text-header-ink-soft">
            <div>Data: bundled snapshot</div>
            <div>Updated {updated}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
        <OverallCard team={data.team} kind={kind} onKindChange={setKind} />
        <SetterShowdownCard leaderboard={leaderboard} />
        <TopBottomCard reps={data.reps} kind={kind} />
        <RepGrid reps={data.reps} team={data.team} kind={kind} repSummaries={data.repSummaries} />
      </main>
    </div>
  );
}
