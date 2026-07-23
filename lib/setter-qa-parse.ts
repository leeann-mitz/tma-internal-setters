import Papa from "papaparse";
import { SETTER_SCRIPT_STEPS, SetterAuditCall, SetterScriptStep, StepValue } from "./setter-qa-types";

/**
 * The sheet uses "M/D/YYYY" for Audit Date. Normalize to YYYY-MM-DD so this
 * source buckets with the same qa-date-utils helpers as the rest of the app.
 */
export function normalizeAuditDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function normalizeStepValue(raw: string | undefined): StepValue | null {
  const v = (raw ?? "").trim().toUpperCase().replace("N/A", "NA");
  if (v === "Y" || v === "P" || v === "N" || v === "NA") return v;
  return null; // rejects stray values like "INCORRECT" rather than guessing
}

function splitBullets(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(" | ")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The call-export "Rep Name" doesn't always match the roster name exactly.
 * Matches by comparing first + last name tokens, ignoring middle
 * names/initials and punctuation (e.g. "Phoebe Collado" vs roster's
 * "Phoebe Estel Ymil Collado").
 */
export function normalizeNameForMatch(name: string): { first: string; last: string } {
  const cleaned = name
    .replace(/[.]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return {
    first: (cleaned[0] || "").toLowerCase(),
    last: (cleaned[cleaned.length - 1] || "").toLowerCase(),
  };
}

// Nicknames the generic first+last matcher can't bridge on its own.
const NAME_ALIASES: Record<string, string> = {
  "Ed Libunao": "Edelson Libunao",
};

export function matchRepName(callRepName: string, rosterNames: string[]): string | null {
  const aliased = NAME_ALIASES[callRepName.trim()];
  if (aliased && rosterNames.includes(aliased)) return aliased;

  const target = normalizeNameForMatch(callRepName);
  for (const roster of rosterNames) {
    const candidate = normalizeNameForMatch(roster);
    if (candidate.first === target.first && candidate.last === target.last) return roster;
  }
  return null;
}

/** E./D. prefixes = booked/sold, F. = declined, everything else = other/in-progress. */
export function categorizeDisposition(disposition: string): "booked" | "declined" | "other" {
  const trimmed = disposition.trim();
  if (/^[ED]\./.test(trimmed)) return "booked";
  if (/^F\./.test(trimmed)) return "declined";
  return "other";
}

export function parseSetterAuditCsv(csv: string): SetterAuditCall[] {
  const rows = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true }).data;
  const calls: SetterAuditCall[] = [];

  for (const row of rows) {
    const callLink = (row["Call Link"] ?? "").trim();
    if (!callLink) continue;

    const auditDate = normalizeAuditDate(row["Audit Date"] ?? "");
    if (!auditDate) continue;

    const repName = (row["Rep Name"] ?? "").trim();
    if (!repName) continue;

    const steps: Partial<Record<SetterScriptStep, StepValue>> = {};
    for (const step of SETTER_SCRIPT_STEPS) {
      const value = normalizeStepValue(row[step]);
      if (value) steps[step] = value;
    }

    const scoreRaw = (row["Overall Quality Score"] ?? "").trim();
    const overallQualityScore = scoreRaw ? Number(scoreRaw) : NaN;

    calls.push({
      repName,
      team: (row["Team"] ?? "").trim(),
      disposition: (row["Call Disposition"] ?? "").trim(),
      objectionType: (row["Objection Type"] ?? "").trim() || null,
      auditDate,
      callLink,
      overallQualityScore: Number.isNaN(overallQualityScore) ? null : overallQualityScore,
      steps,
      opportunities: splitBullets(row["Opportunities"]),
      highlights: splitBullets(row["Highlights"]),
    });
  }

  return calls;
}
