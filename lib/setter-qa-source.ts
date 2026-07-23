import fs from "fs";
import path from "path";
import { RepQaInsightsData, SetterQaInsightsData } from "./setter-qa-types";

/**
 * QA audit insights are a bundled snapshot only, same as the trend data —
 * no live path to the audit sheet at runtime. Refresh by pulling a fresh
 * CSV export into data/qa-audit-raw/ and re-running
 * scripts/generate-qa-insights.ts, then commit + push.
 */
export function getTeamQaInsightsData(): SetterQaInsightsData | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "setter-qa-team-insights.json"), "utf8");
    return JSON.parse(raw) as SetterQaInsightsData;
  } catch {
    return null;
  }
}

export function getRepQaInsightsData(): RepQaInsightsData | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "rep-qa-insights.json"), "utf8");
    return JSON.parse(raw) as RepQaInsightsData;
  } catch {
    return null;
  }
}
