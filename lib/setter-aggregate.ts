import { SetterBlock, OverallViewKind, PeriodPoint } from "./setter-types";

export type NumericMetric = "sets" | "shows" | "showRate" | "closedDeal" | "revenue" | "cashCollected";

export interface TrendResult {
  direction: "up" | "down" | "flat" | "insufficient";
  current: number | null;
  previous: number | null;
  deltaPct: number | null; // signed % change vs previous
}

function lastN(points: PeriodPoint[], metric: NumericMetric, n: number): number[] {
  const values: number[] = [];
  for (let i = points.length - 1; i >= 0 && values.length < n; i--) {
    const v = points[i][metric];
    if (v !== null) values.unshift(v);
  }
  return values;
}

export function computeTrend(points: PeriodPoint[], metric: NumericMetric): TrendResult {
  const vals = lastN(points, metric, 2);
  if (vals.length < 2) {
    return { direction: "insufficient", current: vals[0] ?? null, previous: null, deltaPct: null };
  }
  const [previous, current] = vals;
  const deltaPct = previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100;
  const direction = current > previous ? "up" : current < previous ? "down" : "flat";
  return { direction, current, previous, deltaPct };
}

/** True only when there's a full window of `count` non-null values and each step is a strict decrease. */
export function isConsistentlyDeclining(points: PeriodPoint[], metric: NumericMetric, count = 3): boolean {
  const vals = lastN(points, metric, count);
  if (vals.length < count) return false;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] >= vals[i - 1]) return false;
  }
  return true;
}

export function isConsistentlyImproving(points: PeriodPoint[], metric: NumericMetric, count = 3): boolean {
  const vals = lastN(points, metric, count);
  if (vals.length < count) return false;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] <= vals[i - 1]) return false;
  }
  return true;
}

export function latestPoint(points: PeriodPoint[]): PeriodPoint | null {
  return points.length > 0 ? points[points.length - 1] : null;
}

function yesterdayLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/** "WB MM/DD" for the Monday of the current calendar week — matches the sheet's own WB labeling convention. */
function currentWeekLabel(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `WB ${mm}/${dd}`;
}

/**
 * Resolves a block's points for the Overall Card's view toggle. "yesterday"
 * looks up the daily point whose label matches the actual calendar date for
 * yesterday rather than blindly dropping the last array entry (the sheet
 * doesn't always have today's column yet). "lastWeek" does the same for
 * weekly buckets, dropping the current in-progress WB bucket if present.
 */
export function resolveViewPoints(block: SetterBlock, kind: OverallViewKind): PeriodPoint[] {
  if (kind === "yesterday") {
    const idx = block.daily.findIndex((p) => p.label === yesterdayLabel());
    return idx === -1 ? [] : block.daily.slice(0, idx + 1);
  }
  if (kind === "lastWeek") {
    const idx = block.weekly.findIndex((p) => p.label === currentWeekLabel());
    return idx === -1 ? block.weekly : block.weekly.slice(0, idx);
  }
  return block[kind];
}

/** Human label for the view, e.g. "yesterday (07/14)" or "today (07/15)" once a date is known. */
export function describeViewKind(kind: OverallViewKind, points: PeriodPoint[]): string {
  if (kind === "yesterday" || kind === "daily" || kind === "lastWeek") {
    const word = kind === "daily" ? "today" : kind === "lastWeek" ? "last week" : kind;
    const label = points[points.length - 1]?.label;
    return label ? `${word} (${label})` : word;
  }
  return kind;
}

export interface RankedRep {
  rep: SetterBlock;
  value: number;
}

/** Ranks reps by a metric's latest value for the given view, descending. Zero/null values sort last. */
export function rankReps(reps: SetterBlock[], kind: OverallViewKind, metric: NumericMetric): RankedRep[] {
  return reps
    .map((rep) => {
      const point = latestPoint(resolveViewPoints(rep, kind));
      return { rep, value: point?.[metric] ?? 0 };
    })
    .sort((a, b) => b.value - a.value);
}

/** A rep "worked" a period if they had any sets or shows — distinct from scoring 0% on a rate. */
export function hasActivity(point: PeriodPoint | null): point is PeriodPoint {
  if (!point) return false;
  return (point.sets ?? 0) > 0 || (point.shows ?? 0) > 0;
}

export interface RankedActiveRep {
  rep: SetterBlock;
  point: PeriodPoint;
  rank: number; // 1-based competition ranking — equal values share a rank, the next rank skips (1, 1, 3, 4...)
  tied: boolean; // true when another active rep shares this exact rank
}

/**
 * Ranks reps by a metric, best to worst, for the given view — only among
 * reps who actually had sets/shows in that period. A rep with zero activity
 * isn't the same as a rep who worked and scored 0 on the metric; conflating
 * them would bury real 0-scoring performers in a tie with everyone who
 * simply didn't work that day. Use `inactiveReps` for the rest.
 */
export function rankActiveReps(reps: SetterBlock[], kind: OverallViewKind, metric: NumericMetric): RankedActiveRep[] {
  const active = reps
    .map((rep) => ({ rep, point: latestPoint(resolveViewPoints(rep, kind)) }))
    .filter((r): r is { rep: SetterBlock; point: PeriodPoint } => hasActivity(r.point));
  active.sort((a, b) => (b.point[metric] ?? 0) - (a.point[metric] ?? 0));

  let rank = 0;
  let previousValue: number | null = null;
  const withRank = active.map((r, i) => {
    const value = r.point[metric] ?? 0;
    if (previousValue === null || value !== previousValue) {
      rank = i + 1;
      previousValue = value;
    }
    return { ...r, rank };
  });

  const countByRank = new Map<number, number>();
  for (const r of withRank) countByRank.set(r.rank, (countByRank.get(r.rank) ?? 0) + 1);

  return withRank.map((r) => ({ ...r, tied: (countByRank.get(r.rank) ?? 0) > 1 }));
}

/** The rank values making up the bottom N distinct tiers (e.g. bottom 2 rank values, which may include ties). */
export function bottomTierRanks(ranked: RankedActiveRep[], tiers = 2): Set<number> {
  const distinctDesc = Array.from(new Set(ranked.map((r) => r.rank))).sort((a, b) => b - a);
  return new Set(distinctDesc.slice(0, tiers));
}

export function inactiveReps(reps: SetterBlock[], kind: OverallViewKind): SetterBlock[] {
  return reps.filter((rep) => !hasActivity(latestPoint(resolveViewPoints(rep, kind))));
}

export type FlagLevel = "red" | "amber" | "gray" | "green";

export interface RepFlag {
  level: FlagLevel;
  label: string;
  detail: string;
}

const MIN_SAMPLE_SETS = 5;
const BELOW_AVG_SHOW_RATE_GAP = 15; // percentage points

/**
 * Evaluates monitoring flags for a rep against the weekly series (stable
 * enough cadence to judge trend without daily noise). Sets is the setter's
 * own craft metric (unlike closers, whose flags center on close rate), so
 * flags here center on sets volume and show rate.
 */
export function evaluateRepFlags(rep: SetterBlock, team: SetterBlock): RepFlag[] {
  const flags: RepFlag[] = [];
  const weekly = rep.weekly;
  const latest = latestPoint(weekly);
  const teamLatest = latestPoint(team.weekly);

  if (!latest) {
    return [{ level: "gray", label: "No data yet", detail: "No weekly activity recorded for this rep." }];
  }

  if (isConsistentlyDeclining(weekly, "sets", 3)) {
    flags.push({
      level: "red",
      label: "Declining sets",
      detail: "Sets have dropped for 3 straight weeks.",
    });
  }

  if (
    teamLatest?.showRate != null &&
    latest.showRate != null &&
    (latest.sets ?? 0) >= MIN_SAMPLE_SETS &&
    teamLatest.showRate - latest.showRate >= BELOW_AVG_SHOW_RATE_GAP
  ) {
    flags.push({
      level: "amber",
      label: "Below-average show rate",
      detail: `${latest.showRate.toFixed(0)}% vs team's ${teamLatest.showRate.toFixed(0)}% this week.`,
    });
  }

  if ((latest.sets ?? 0) < MIN_SAMPLE_SETS) {
    flags.push({
      level: "gray",
      label: "Low sample size",
      detail: `Only ${latest.sets ?? 0} set${latest.sets === 1 ? "" : "s"} this week — rates aren't statistically meaningful yet.`,
    });
  }

  if (isConsistentlyImproving(weekly, "sets", 3)) {
    flags.push({
      level: "green",
      label: "Improving",
      detail: "Sets have risen for 3 straight weeks.",
    });
  }

  if (flags.length === 0) {
    flags.push({
      level: "gray",
      label: "Steady — monitor",
      detail: "No red flags, but no confirmed upward trend either. Worth watching.",
    });
  }

  return flags;
}

export function worstFlagLevel(flags: RepFlag[]): FlagLevel {
  if (flags.some((f) => f.level === "red")) return "red";
  if (flags.some((f) => f.level === "amber")) return "amber";
  if (flags.some((f) => f.level === "green")) return "green";
  return "gray";
}
