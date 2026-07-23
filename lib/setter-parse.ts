import Papa from "papaparse";
import {
  LeaderboardData,
  LeaderboardRow,
  PeriodKind,
  PeriodPoint,
  RepSummary,
  SetterBlock,
  SetterTrendData,
  TEAM_METRIC_ROW_ORDER,
} from "./setter-types";

// People who show up in the sheet's rep-level tables (usually with all
// zeros) but aren't actually setters being measured: Philip is the team
// lead, Jessika handles cancelled/no-show calls rather than setting.
const EXCLUDED_REPS = new Set(["Philip Josh Caperig", "Jessika Elliott"]);

const MONTH_NAMES = new Set([
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
  "january", "february", "march", "april", "june", "july", "august",
  "september", "october", "november", "december",
]);

function classifyColumn(label: string): PeriodKind | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  if (/^WB\s*\d{1,2}\/\d{1,2}$/i.test(trimmed)) return "weekly";
  if (/^\d{1,2}\/\d{1,2}$/.test(trimmed)) return "daily";
  if (MONTH_NAMES.has(trimmed.toLowerCase())) return "monthly";
  return null;
}

function parseNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return null;
  const isPercent = trimmed.endsWith("%");
  const cleaned = trimmed.replace(/[$,%]/g, "");
  if (!cleaned || cleaned === "-") return null;
  const value = Number(cleaned);
  if (Number.isNaN(value)) return null;
  return isPercent ? value : value;
}

interface ColumnMeta {
  index: number;
  kind: PeriodKind;
  label: string;
}

function emptyBlock(name: string, isTeamTotal: boolean): SetterBlock {
  return { name, isTeamTotal, monthly: [], weekly: [], daily: [] };
}

function findColumns(periodRow: string[], startCol: number): ColumnMeta[] {
  const columns: ColumnMeta[] = [];
  for (let c = startCol; c < periodRow.length; c++) {
    const kind = classifyColumn(periodRow[c] ?? "");
    if (kind) columns.push({ index: c, kind, label: (periodRow[c] ?? "").trim() });
  }
  return columns;
}

/**
 * Parses the "IS Trend View" tab. Unlike CLOSER Trend View's block-per-rep
 * layout, this sheet is block-per-metric-group:
 *   1. One team block: "Internal Setter (Team X)" title row (which doubles
 *      as the Monthly/Weekly/Daily group-header row), a period-label row,
 *      then 6 fixed metric rows (Sets, Show, Closed Deal, Show Rate,
 *      Revenue, Cash Collected).
 *   2. One block per per-rep metric ("Setter Sets Trend", "Setter Shows
 *      Trend"), each with a "Name" header row, a period-label row, then one
 *      data row per rep. There's no per-rep Closed Deal/Revenue breakdown at
 *      this grain — setters aren't credited with those daily/weekly, only
 *      at the team level and in the Executive Summary's current-month snap.
 */
export function parseIsTrendCsv(csv: string): { team: SetterBlock; reps: SetterBlock[] } {
  const rows = Papa.parse<string[]>(csv, { skipEmptyLines: false }).data;

  let team = emptyBlock("Internal Setter Team", true);
  const repPoints = new Map<string, { sets: Map<string, Map<PeriodKind, number | null>>; shows: Map<string, Map<PeriodKind, number | null>> }>();
  // repName -> kind -> label -> value, separately for sets and shows
  const setsByRep = new Map<string, { kind: PeriodKind; label: string; value: number | null }[]>();
  const showsByRep = new Map<string, { kind: PeriodKind; label: string; value: number | null }[]>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const teamCol = row.findIndex((cell) => /^Internal Setter \(/i.test((cell ?? "").trim()));
    if (teamCol !== -1) {
      const title = (row[teamCol] ?? "").trim();
      const periodRow = rows[i + 1];
      if (!periodRow) continue;
      const columns = findColumns(periodRow, teamCol + 1);

      const metricRows = new Map<string, string[]>();
      for (let r = i + 2; r < Math.min(i + 2 + TEAM_METRIC_ROW_ORDER.length + 2, rows.length); r++) {
        const label = (rows[r]?.[teamCol] ?? "").trim();
        if (!label) break;
        if ((TEAM_METRIC_ROW_ORDER as readonly string[]).includes(label)) {
          metricRows.set(label, rows[r]);
        }
      }

      team = emptyBlock(title, true);
      for (const col of columns) {
        const shows = parseNumber(metricRows.get("Show")?.[col.index]);
        const closedDeal = parseNumber(metricRows.get("Closed Deal")?.[col.index]);
        const point: PeriodPoint = {
          label: col.label,
          sets: parseNumber(metricRows.get("Sets")?.[col.index]),
          shows,
          showRate: parseNumber(metricRows.get("Show Rate")?.[col.index]),
          closedDeal,
          closeRate: shows && shows > 0 && closedDeal != null ? (closedDeal / shows) * 100 : null,
          revenue: parseNumber(metricRows.get("Revenue")?.[col.index]),
          cashCollected: parseNumber(metricRows.get("Cash Collected")?.[col.index]),
        };
        team[col.kind].push(point);
      }
      continue;
    }

    const metricBlockCol = row.findIndex((cell) => /^Setter (Sets|Shows) Trend$/i.test((cell ?? "").trim()));
    if (metricBlockCol !== -1) {
      const title = (row[metricBlockCol] ?? "").trim();
      const metric: "sets" | "shows" = /Sets/i.test(title) ? "sets" : "shows";
      const headerRow = rows[i + 1]; // "Name,Monthly,,,,,,Weekly,..."
      const periodRow = rows[i + 2];
      if (!headerRow || !periodRow) continue;
      const nameCol = headerRow.findIndex((cell) => (cell ?? "").trim() === "Name");
      const labelCol = nameCol !== -1 ? nameCol : metricBlockCol;
      const columns = findColumns(periodRow, labelCol + 1);

      for (let r = i + 3; r < rows.length; r++) {
        const name = (rows[r]?.[labelCol] ?? "").trim();
        if (!name) break;
        const target = metric === "sets" ? setsByRep : showsByRep;
        const list = target.get(name) ?? [];
        for (const col of columns) {
          list.push({ kind: col.kind, label: col.label, value: parseNumber(rows[r]?.[col.index]) });
        }
        target.set(name, list);
      }
    }
  }

  const names = new Set([...setsByRep.keys(), ...showsByRep.keys()]);
  const reps: SetterBlock[] = [];
  for (const name of names) {
    if (EXCLUDED_REPS.has(name)) continue;
    const block = emptyBlock(name, false);
    const setsList = setsByRep.get(name) ?? [];
    const showsList = showsByRep.get(name) ?? [];
    const showsByKey = new Map(showsList.map((p) => [`${p.kind}|${p.label}`, p.value]));

    for (const s of setsList) {
      const key = `${s.kind}|${s.label}`;
      const sets = s.value;
      const shows = showsByKey.get(key) ?? null;
      const showRate = sets && sets > 0 && shows != null ? (shows / sets) * 100 : null;
      block[s.kind].push({
        label: s.label,
        sets,
        shows,
        showRate,
        closedDeal: null,
        closeRate: null,
        revenue: null,
        cashCollected: null,
      });
    }
    reps.push(block);
  }

  return { team, reps };
}

/**
 * Parses the "Internal Setter Executive Summary" tab's current-month
 * per-rep table (Name, Revenue, Net Cash Collected, Sets, Show, Closed
 * Deal, Show Rate, Closed Deal Rate), stopping at "Grand Total".
 */
export function parseExecutiveSummaryCsv(csv: string): RepSummary[] {
  const rows = Papa.parse<string[]>(csv, { skipEmptyLines: false }).data;

  let monthLabel = "";
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const found = (rows[i] ?? []).find((cell) => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test((cell ?? "").trim()));
    if (found) {
      monthLabel = found.trim();
      break;
    }
  }

  const headerRowIdx = rows.findIndex((row) => row?.some((cell) => (cell ?? "").trim() === "Net Cash Collected"));
  if (headerRowIdx === -1) return [];
  const headerRow = rows[headerRowIdx];
  const nameCol = headerRow.findIndex((cell) => (cell ?? "").trim() === "Name");
  if (nameCol === -1) return [];

  const summaries: RepSummary[] = [];
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const name = (row[nameCol] ?? "").trim();
    if (!name) break;
    if (name === "Grand Total") break;
    if (EXCLUDED_REPS.has(name)) continue;
    summaries.push({
      name,
      monthLabel,
      revenue: parseNumber(row[nameCol + 1]),
      netCashCollected: parseNumber(row[nameCol + 2]),
      sets: parseNumber(row[nameCol + 3]),
      shows: parseNumber(row[nameCol + 4]),
      closedDeal: parseNumber(row[nameCol + 5]),
      showRate: parseNumber(row[nameCol + 6]),
      closedDealRate: parseNumber(row[nameCol + 7]),
    });
  }
  return summaries;
}

/**
 * Parses the "Setter Leaderboard" tab's current-month block (left-hand
 * side only — a separate quarterly bonus table sits to the right of it and
 * is out of scope for v1).
 */
export function parseLeaderboardCsv(csv: string): LeaderboardData {
  const rows = Papa.parse<string[]>(csv, { skipEmptyLines: false }).data;

  const headerRowIdx = rows.findIndex((row) => {
    const idx = row?.findIndex((cell) => (cell ?? "").trim() === "Show");
    return idx != null && idx !== -1 && (row[idx + 1] ?? "").trim() === "Cash Collected";
  });
  if (headerRowIdx === -1) return { monthLabel: "", rows: [] };

  const headerRow = rows[headerRowIdx];
  const showCol = headerRow.findIndex((cell) => (cell ?? "").trim() === "Show");
  const nameCol = showCol - 1;
  const monthLabel = (headerRow[nameCol] ?? "").trim();

  const rowsOut: LeaderboardRow[] = [];
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const name = (row[nameCol] ?? "").trim();
    if (!name) break;
    if (EXCLUDED_REPS.has(name)) continue;
    rowsOut.push({
      name,
      show: parseNumber(row[nameCol + 1]),
      cashCollected: parseNumber(row[nameCol + 2]),
      conversion: parseNumber(row[nameCol + 3]),
      showBonus: parseNumber(row[nameCol + 4]),
      ccBonus: parseNumber(row[nameCol + 5]),
      topShow: parseNumber(row[nameCol + 6]),
      topCash: parseNumber(row[nameCol + 7]),
      totalBonus: parseNumber(row[nameCol + 8]),
    });
  }
  return { monthLabel, rows: rowsOut };
}

export function buildTrendData(
  isTrendCsv: string,
  executiveSummaryCsv: string,
  source: SetterTrendData["source"],
): SetterTrendData {
  const { team, reps } = parseIsTrendCsv(isTrendCsv);
  const repSummaries = parseExecutiveSummaryCsv(executiveSummaryCsv);
  return {
    generatedAt: new Date().toISOString(),
    source,
    team,
    reps,
    repSummaries,
  };
}
