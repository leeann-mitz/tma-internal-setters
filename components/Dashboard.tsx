"use client";

import { useState } from "react";
import Link from "next/link";
import { LeaderboardData, OverallViewKind, SetterTrendData } from "@/lib/setter-types";
import { RepQaInsightsData } from "@/lib/setter-qa-types";
import { ArrowRight } from "lucide-react";
import OverallCard from "./OverallCard";
import SetterShowdownCard from "./SetterShowdownCard";
import TopBottomCard from "./TopBottomCard";
import RepGrid from "./RepGrid";
import RepQaModal from "./RepQaModal";

export default function Dashboard({
  data,
  leaderboard,
  repQaInsights,
}: {
  data: SetterTrendData;
  leaderboard: LeaderboardData;
  repQaInsights: RepQaInsightsData | null;
}) {
  const [kind, setKind] = useState<OverallViewKind>("weekly");
  const [selectedRep, setSelectedRep] = useState<string | null>(null);
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
          <div className="flex items-center gap-4">
            <Link
              href="/qa-insights"
              className="inline-flex items-center gap-1 rounded-md border border-header-line px-3 py-1.5 text-xs font-medium text-header-ink-soft hover:border-header-ink-soft hover:text-header-ink"
            >
              Call QA Insights <ArrowRight size={12} />
            </Link>
            <div className="text-right text-xs text-header-ink-soft">
              <div>Data: bundled snapshot</div>
              <div>Updated {updated}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
        <OverallCard team={data.team} kind={kind} onKindChange={setKind} />
        <SetterShowdownCard leaderboard={leaderboard} />
        <TopBottomCard reps={data.reps} kind={kind} />
        <RepGrid
          reps={data.reps}
          team={data.team}
          kind={kind}
          repSummaries={data.repSummaries}
          onSelectRep={setSelectedRep}
        />
      </main>

      {selectedRep && (
        <RepQaModal
          repName={selectedRep}
          insights={repQaInsights?.reps.find((r) => r.repName === selectedRep) ?? null}
          sourcePeriodLabel={repQaInsights?.sourcePeriodLabel ?? null}
          onClose={() => setSelectedRep(null)}
        />
      )}
    </div>
  );
}
