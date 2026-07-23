import { matchRepName } from "./setter-qa-parse";
import { RepQaInsights, RepQaInsightsData, SetterAuditCall } from "./setter-qa-types";

/**
 * Groups audited calls by matched rep, and synthesizes per-rep Top
 * Opportunities (most frequent weak script steps across their calls) and
 * an Urgent Action (their single lowest-scored call — the most concrete,
 * most actionable coaching moment).
 */
export function buildRepQaInsights(
  calls: SetterAuditCall[],
  rosterNames: string[],
  sourcePeriodLabel: string
): RepQaInsightsData {
  const byRep = new Map<string, SetterAuditCall[]>();

  for (const call of calls) {
    const matched = matchRepName(call.repName, rosterNames);
    if (!matched) continue; // not on the current setter roster (team lead, recovery-call rep, etc.)
    if (!byRep.has(matched)) byRep.set(matched, []);
    byRep.get(matched)!.push(call);
  }

  const reps: RepQaInsights[] = [];
  for (const [repName, repCalls] of byRep.entries()) {
    const scoredCalls = repCalls.filter((c) => c.overallQualityScore != null);

    const stepCounts = new Map<string, number>();
    for (const c of repCalls) {
      for (const [step, value] of Object.entries(c.steps)) {
        if (value === "N" || value === "P") {
          stepCounts.set(step, (stepCounts.get(step) ?? 0) + 1);
        }
      }
    }
    const topOpportunities = Array.from(stepCounts.entries())
      .map(([step, count]) => ({ step, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const worst = [...scoredCalls].sort((a, b) => (a.overallQualityScore ?? 10) - (b.overallQualityScore ?? 10))[0] ?? null;
    const urgentAction = worst
      ? {
          detail: worst.opportunities[0] ?? "Low-scoring call — review the recording for specifics.",
          callLink: worst.callLink,
          callDate: worst.auditDate,
          score: worst.overallQualityScore,
        }
      : null;

    const averageScore =
      scoredCalls.length > 0
        ? Math.round((scoredCalls.reduce((sum, c) => sum + (c.overallQualityScore ?? 0), 0) / scoredCalls.length) * 10) / 10
        : null;

    reps.push({
      repName,
      periodLabel: sourcePeriodLabel,
      callCount: repCalls.length,
      scoredCallCount: scoredCalls.length,
      averageScore,
      topOpportunities,
      urgentAction,
      calls: [...repCalls].sort((a, b) => (a.auditDate < b.auditDate ? 1 : -1)),
    });
  }

  reps.sort((a, b) => a.repName.localeCompare(b.repName));

  return {
    generatedAt: new Date().toISOString(),
    sourcePeriodLabel,
    reps,
  };
}
