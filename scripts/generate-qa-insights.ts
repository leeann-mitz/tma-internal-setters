import fs from "fs";
import path from "path";
import { parseSetterAuditCsv } from "../lib/setter-qa-parse";
import { buildTeamQaInsights } from "../lib/setter-qa-aggregate";
import { buildRepQaInsights } from "../lib/setter-qa-rep-aggregate";
import { SetterAuditCall } from "../lib/setter-qa-types";
import { SetterTrendData } from "../lib/setter-types";

const RAW_DIR = path.join(__dirname, "../data/qa-audit-raw");
const TEAM_OUT_PATH = path.join(__dirname, "../data/setter-qa-team-insights.json");
const REP_OUT_PATH = path.join(__dirname, "../data/rep-qa-insights.json");
const TREND_SNAPSHOT_PATH = path.join(__dirname, "../data/is-trend-snapshot.json");

// Roster = trend reps (11) union repSummaries names (adds Makkie Mendez,
// who has real but very light activity and isn't in the trend blocks).
// Philip/Jessika are already excluded upstream (setter-parse.ts), so their
// QA calls simply won't match anything here and get silently dropped.
function loadRosterNames(): string[] {
  const snapshot = JSON.parse(fs.readFileSync(TREND_SNAPSHOT_PATH, "utf8")) as SetterTrendData;
  const names = new Set<string>();
  for (const r of snapshot.reps) names.add(r.name);
  for (const s of snapshot.repSummaries) names.add(s.name);
  return Array.from(names);
}

function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`No directory found at ${RAW_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".csv"));
  if (files.length === 0) {
    console.error(`No CSVs found in ${RAW_DIR}`);
    process.exit(1);
  }

  const seenCallLinks = new Set<string>();
  const allCalls: SetterAuditCall[] = [];

  for (const file of files) {
    const csv = fs.readFileSync(path.join(RAW_DIR, file), "utf8");
    for (const call of parseSetterAuditCsv(csv)) {
      // Multiple exports can overlap; dedupe by call link.
      if (seenCallLinks.has(call.callLink)) continue;
      seenCallLinks.add(call.callLink);
      allCalls.push(call);
    }
  }

  const roster = loadRosterNames();
  console.log("Roster names for QA matching:", roster.sort());

  const teamData = buildTeamQaInsights(allCalls, roster);
  fs.writeFileSync(TEAM_OUT_PATH, JSON.stringify(teamData, null, 2));
  console.log(`Wrote ${TEAM_OUT_PATH}`);
  console.log(
    `Team QA insights: ${teamData.daily.length} daily, ${teamData.weekly.length} weekly, ${teamData.monthly.length} monthly buckets (${allCalls.length} total audited calls)`
  );

  console.log("Raw rep names seen in QA data:", Array.from(new Set(allCalls.map((c) => c.repName))).sort());

  const dates = allCalls.map((c) => c.auditDate).sort();
  const periodLabel = dates.length > 0 ? (dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]} – ${dates[dates.length - 1]}`) : "";
  const repData = buildRepQaInsights(allCalls, roster, periodLabel);
  fs.writeFileSync(REP_OUT_PATH, JSON.stringify(repData, null, 2));
  console.log(`Wrote ${REP_OUT_PATH}`);
  console.log(`Period: ${periodLabel}, ${repData.reps.length} reps matched out of ${roster.length} on roster`);
}

main();
