// The setter script checklist from the human-audited "TMA Internal
// Setters_QA_Audit_Summary_2026" sheet, in sheet order. "VIP Billing
// Explanation" is deliberately excluded — it's almost always NA (only
// applies to VIP sales), which would clutter the breakdown with a
// near-zero-sample step.
export const SETTER_SCRIPT_STEPS = [
  "Phase 1 - Intro",
  "Phase 2 - Discovery",
  "Phase 3 - Identity Frame",
  "Phase 4 - Credibility",
  "Phase 5 - Cost Filter",
  "Phase 6 - Handoff",
  "Objection Handling Score",
  "Downsell Executed",
] as const;

export type SetterScriptStep = (typeof SETTER_SCRIPT_STEPS)[number];
export type StepValue = "Y" | "P" | "N" | "NA";

export interface SetterAuditCall {
  repName: string;
  team: string;
  disposition: string;
  objectionType: string | null;
  auditDate: string; // YYYY-MM-DD, normalized
  callLink: string;
  overallQualityScore: number | null;
  steps: Partial<Record<SetterScriptStep, StepValue>>;
  opportunities: string[];
  highlights: string[];
}

export interface SectionExample {
  repName: string;
  callLink: string;
  date: string;
  bullets: string[];
}

export interface SectionBreakdown {
  section: string;
  weakCount: number;
  scoredCallCount: number;
  weakPct: number; // 0-100
  examples: SectionExample[];
}

export interface ObjectionExample {
  repName: string;
  date: string;
  callLink: string;
}

export interface ObjectionBreakdown {
  objectionType: string;
  count: number;
  calls: ObjectionExample[]; // most recent first, capped
}

export interface UrgentCoachingItem {
  repName: string;
  callLink: string;
  date: string;
  score: number | null;
  reason: string;
}

export interface TopPerformer {
  repName: string;
  avgScore: number;
  callCount: number;
  topHighlight: string | null;
  exampleCallLink: string | null;
}

export interface SetterQaSnapshot {
  label: string; // "07/23" / "WB 07/20" / "Jul"
  totalCalls: number;
  bookedCount: number; // Call Disposition prefix E./D.
  declinedCount: number; // prefix F.
  otherCount: number; // everything else (A/B/C/G/L/M/Q/X)
  scoredCallCount: number;
  avgQualityScore: number | null;
  breakdownBySteps: SectionBreakdown[]; // worst first
  topObjections: ObjectionBreakdown[];
  urgentCoaching: UrgentCoachingItem[];
  topPerformers: TopPerformer[];
}

export interface SetterQaInsightsData {
  generatedAt: string;
  daily: SetterQaSnapshot[];
  weekly: SetterQaSnapshot[];
  monthly: SetterQaSnapshot[];
}

export interface RepQaOpportunity {
  step: string;
  count: number;
}

export interface RepQaInsights {
  repName: string;
  periodLabel: string;
  callCount: number;
  scoredCallCount: number;
  averageScore: number | null;
  topOpportunities: RepQaOpportunity[];
  urgentAction: {
    detail: string;
    callLink: string;
    callDate: string;
    score: number | null;
  } | null;
  calls: SetterAuditCall[];
}

export interface RepQaInsightsData {
  generatedAt: string;
  sourcePeriodLabel: string;
  reps: RepQaInsights[];
}
