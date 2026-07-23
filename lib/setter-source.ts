import fs from "fs";
import path from "path";
import { buildTrendData, parseLeaderboardCsv } from "./setter-parse";
import { LeaderboardData, SetterTrendData } from "./setter-types";

// Bundled-snapshot only — no live sync. closer-performance-trends tried
// live "publish to web" sync and had to disable it (Vercel kept serving a
// stale cached export that didn't match real sheet edits), so this app
// skips that path entirely rather than repeat the same failure mode.
// Refresh via `npx tsx scripts/generate-snapshot.ts` after re-pulling fresh
// CSV exports — see README.

function readData(): SetterTrendData {
  const jsonPath = path.join(process.cwd(), "data", "is-trend-snapshot.json");
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw) as SetterTrendData;
}

function readLeaderboard(): LeaderboardData {
  const jsonPath = path.join(process.cwd(), "data", "is-leaderboard-snapshot.json");
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw) as LeaderboardData;
}

export async function getSetterTrendData(): Promise<SetterTrendData> {
  return readData();
}

export async function getLeaderboardData(): Promise<LeaderboardData> {
  return readLeaderboard();
}

// Re-exported for the generate-snapshot script.
export { buildTrendData, parseLeaderboardCsv };
