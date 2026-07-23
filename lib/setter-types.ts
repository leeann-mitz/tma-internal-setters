export type PeriodKind = "monthly" | "weekly" | "daily";

// Mirrors closer-performance-trends' OverallViewKind: "yesterday" reuses the
// daily series but drops today's still-in-progress point; "lastWeek" does the
// same one level up, dropping the current in-progress WB bucket.
export type OverallViewKind = PeriodKind | "yesterday" | "lastWeek";

export interface PeriodPoint {
  label: string;
  sets: number | null;
  shows: number | null;
  showRate: number | null; // 0-100, computed as shows/sets — the sheet doesn't track this per rep directly
  closedDeal: number | null;
  revenue: number | null;
  cashCollected: number | null;
}

export interface SetterBlock {
  name: string;
  isTeamTotal: boolean;
  monthly: PeriodPoint[];
  weekly: PeriodPoint[];
  daily: PeriodPoint[];
}

/**
 * Current-month per-rep summary from the "Internal Setter Executive Summary"
 * tab. This data only exists as a single current-month snapshot in the
 * sheet (no daily/weekly/historical-monthly breakdown per rep for these
 * fields) — kept separate from PeriodPoint rather than faked into a time
 * series.
 */
export interface RepSummary {
  name: string;
  monthLabel: string;
  revenue: number | null;
  netCashCollected: number | null;
  sets: number | null;
  shows: number | null;
  closedDeal: number | null;
  showRate: number | null;
  closedDealRate: number | null;
}

export interface SetterTrendData {
  generatedAt: string;
  source: "snapshot";
  team: SetterBlock;
  reps: SetterBlock[];
  repSummaries: RepSummary[];
}

export interface LeaderboardRow {
  name: string;
  show: number | null;
  cashCollected: number | null;
  conversion: number | null;
  showBonus: number | null;
  ccBonus: number | null;
  topShow: number | null;
  topCash: number | null;
  totalBonus: number | null;
}

export interface LeaderboardData {
  monthLabel: string;
  rows: LeaderboardRow[];
}

export const TEAM_METRIC_ROW_ORDER = [
  "Sets",
  "Show",
  "Closed Deal",
  "Show Rate",
  "Revenue",
  "Cash Collected",
] as const;
