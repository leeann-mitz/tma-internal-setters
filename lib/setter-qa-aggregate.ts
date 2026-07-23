import { SetterAuditCall, SETTER_SCRIPT_STEPS, SetterScriptStep, SectionBreakdown, SectionExample, ObjectionBreakdown, SetterQaSnapshot, SetterQaInsightsData } from "./setter-qa-types";
import { categorizeDisposition, matchRepName } from "./setter-qa-parse";
import { OverallViewKind } from "./setter-types";
import { MONTH_NAMES, monthLabel, toMonthDay, todayLabel, weekBeginningLabel, yesterdayLabel } from "./qa-date-utils";

const EXCLUDED_OBJECTIONS = new Set(["No Objection", "Call Incomplete"]);
const MIN_SAMPLE_FOR_TOP_PERFORMER = 2;

function buildExamplesForStep(step: SetterScriptStep, calls: SetterAuditCall[], rosterNames: string[]): SectionExample[] {
  const examples: SectionExample[] = [];
  for (const call of calls) {
    const value = call.steps[step];
    if (value !== "N" && value !== "P") continue;
    examples.push({
      repName: matchRepName(call.repName, rosterNames) ?? call.repName,
      callLink: call.callLink,
      date: call.auditDate,
      bullets: [`${step} was rated "${value}" on this call.`],
    });
  }
  return examples.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);
}

function buildSnapshot(label: string, calls: SetterAuditCall[], rosterNames: string[]): SetterQaSnapshot {
  const matched = calls.filter((c) => matchRepName(c.repName, rosterNames) != null);
  const scored = matched.filter((c) => c.overallQualityScore != null);

  let bookedCount = 0;
  let declinedCount = 0;
  let otherCount = 0;
  for (const c of matched) {
    const cat = categorizeDisposition(c.disposition);
    if (cat === "booked") bookedCount++;
    else if (cat === "declined") declinedCount++;
    else otherCount++;
  }

  const breakdownBySteps: SectionBreakdown[] = SETTER_SCRIPT_STEPS.map((step) => {
    const applicable = matched.filter((c) => c.steps[step] && c.steps[step] !== "NA");
    const weak = applicable.filter((c) => c.steps[step] === "N" || c.steps[step] === "P");
    return {
      section: step,
      weakCount: weak.length,
      scoredCallCount: applicable.length,
      weakPct: applicable.length > 0 ? Math.round((weak.length / applicable.length) * 100) : 0,
      examples: buildExamplesForStep(step, matched, rosterNames),
    };
  })
    .filter((b) => b.scoredCallCount > 0)
    .sort((a, b) => b.weakPct - a.weakPct);

  const objectionGroups = new Map<string, SetterAuditCall[]>();
  for (const c of matched) {
    if (!c.objectionType || EXCLUDED_OBJECTIONS.has(c.objectionType)) continue;
    if (!objectionGroups.has(c.objectionType)) objectionGroups.set(c.objectionType, []);
    objectionGroups.get(c.objectionType)!.push(c);
  }
  const topObjections: ObjectionBreakdown[] = Array.from(objectionGroups.entries())
    .map(([objectionType, objCalls]) => ({
      objectionType,
      count: objCalls.length,
      calls: [...objCalls]
        .sort((a, b) => (a.auditDate < b.auditDate ? 1 : -1))
        .slice(0, 10)
        .map((c) => ({
          repName: matchRepName(c.repName, rosterNames) ?? c.repName,
          date: c.auditDate,
          callLink: c.callLink,
        })),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const urgentCoaching = [...scored]
    .sort((a, b) => (a.overallQualityScore ?? 10) - (b.overallQualityScore ?? 10))
    .slice(0, 5)
    .map((c) => ({
      repName: matchRepName(c.repName, rosterNames) ?? c.repName,
      callLink: c.callLink,
      date: c.auditDate,
      score: c.overallQualityScore,
      reason: c.opportunities[0] ?? "Low-scoring call — review the recording.",
    }));

  const byRep = new Map<string, SetterAuditCall[]>();
  for (const c of scored) {
    const key = matchRepName(c.repName, rosterNames) ?? c.repName;
    if (!byRep.has(key)) byRep.set(key, []);
    byRep.get(key)!.push(c);
  }
  const topPerformers = Array.from(byRep.entries())
    .map(([repName, repCalls]) => {
      const avg = repCalls.reduce((sum, c) => sum + (c.overallQualityScore ?? 0), 0) / repCalls.length;
      const byScoreDesc = [...repCalls].sort((a, b) => (b.overallQualityScore ?? 0) - (a.overallQualityScore ?? 0));
      const bestWithHighlight = byScoreDesc.find((c) => c.highlights.length > 0);
      const bestCall = bestWithHighlight ?? byScoreDesc[0];
      return {
        repName,
        avgScore: Math.round(avg * 10) / 10,
        callCount: repCalls.length,
        topHighlight: bestCall?.highlights[0] ?? null,
        exampleCallLink: bestCall?.callLink ?? null,
      };
    })
    .filter((p) => p.callCount >= MIN_SAMPLE_FOR_TOP_PERFORMER)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3);

  return {
    label,
    totalCalls: matched.length,
    bookedCount,
    declinedCount,
    otherCount,
    scoredCallCount: scored.length,
    avgQualityScore:
      scored.length > 0 ? Math.round((scored.reduce((s, c) => s + (c.overallQualityScore ?? 0), 0) / scored.length) * 10) / 10 : null,
    breakdownBySteps,
    topObjections,
    urgentCoaching,
    topPerformers,
  };
}

function bucketBy(calls: SetterAuditCall[], labelFn: (dateStr: string) => string): Map<string, SetterAuditCall[]> {
  const map = new Map<string, SetterAuditCall[]>();
  for (const c of calls) {
    const label = labelFn(c.auditDate);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(c);
  }
  return map;
}

export function buildTeamQaInsights(calls: SetterAuditCall[], rosterNames: string[]): SetterQaInsightsData {
  const dailyMap = bucketBy(calls, toMonthDay);
  const weeklyMap = bucketBy(calls, weekBeginningLabel);
  const monthlyMap = bucketBy(calls, monthLabel);

  const daily = Array.from(dailyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([label, c]) => buildSnapshot(label, c, rosterNames));

  const weekly = Array.from(weeklyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([label, c]) => buildSnapshot(label, c, rosterNames));

  const monthly = Array.from(monthlyMap.entries())
    .sort((a, b) => MONTH_NAMES.indexOf(a[0]) - MONTH_NAMES.indexOf(b[0]))
    .map(([label, c]) => buildSnapshot(label, c, rosterNames));

  return { generatedAt: new Date().toISOString(), daily, weekly, monthly };
}

/** Honest "no data yet" if the exact date hasn't been audited, rather than silently falling back to an older day. */
export function resolveTeamSnapshot(data: SetterQaInsightsData, kind: OverallViewKind): SetterQaSnapshot | null {
  if (kind === "monthly") return data.monthly[data.monthly.length - 1] ?? null;
  if (kind === "weekly") return data.weekly[data.weekly.length - 1] ?? null;
  if (kind === "lastWeek") {
    const label = weekBeginningLabel(new Date().toISOString().slice(0, 10));
    const idx = data.weekly.findIndex((w) => w.label === label);
    return (idx === -1 ? data.weekly[data.weekly.length - 1] : data.weekly[idx - 1]) ?? null;
  }
  if (kind === "yesterday") return data.daily.find((d) => d.label === yesterdayLabel()) ?? null;
  return data.daily.find((d) => d.label === todayLabel()) ?? null;
}
