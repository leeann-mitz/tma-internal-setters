import fs from "fs";
import path from "path";
import { buildTrendData, parseLeaderboardCsv } from "../lib/setter-parse";

const isTrendCsvPath = path.join(__dirname, "../data/is-trend-snapshot.csv");
const execSummaryCsvPath = path.join(__dirname, "../data/is-executive-summary.csv");
const leaderboardCsvPath = path.join(__dirname, "../data/is-leaderboard.csv");

const trendOutPath = path.join(__dirname, "../data/is-trend-snapshot.json");
const leaderboardOutPath = path.join(__dirname, "../data/is-leaderboard-snapshot.json");

const isTrendCsv = fs.readFileSync(isTrendCsvPath, "utf8");
const execSummaryCsv = fs.readFileSync(execSummaryCsvPath, "utf8");
const leaderboardCsv = fs.readFileSync(leaderboardCsvPath, "utf8");

const trendData = buildTrendData(isTrendCsv, execSummaryCsv, "snapshot");
const leaderboardData = parseLeaderboardCsv(leaderboardCsv);

fs.writeFileSync(trendOutPath, JSON.stringify(trendData, null, 2));
fs.writeFileSync(leaderboardOutPath, JSON.stringify(leaderboardData, null, 2));

console.log(`Wrote ${trendOutPath} — team + ${trendData.reps.length} reps, ${trendData.repSummaries.length} rep summaries`);
console.log(`Wrote ${leaderboardOutPath} — ${leaderboardData.rows.length} leaderboard rows (${leaderboardData.monthLabel})`);
