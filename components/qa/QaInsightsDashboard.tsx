"use client";

import { useState } from "react";
import Link from "next/link";
import { SetterBlock, OverallViewKind } from "@/lib/setter-types";
import { SetterQaInsightsData, ObjectionBreakdown, SectionBreakdown } from "@/lib/setter-qa-types";
import { resolveTeamSnapshot } from "@/lib/setter-qa-aggregate";
import { bottomTierRanks, rankActiveReps } from "@/lib/setter-aggregate";
import { formatNumber } from "@/lib/format";
import PeriodToggle from "../PeriodToggle";
import { AlertTriangle, ArrowLeft, ChevronDown, ExternalLink, Trophy } from "lucide-react";

function describeKind(kind: OverallViewKind): string {
  if (kind === "daily") return "today";
  if (kind === "lastWeek") return "last week";
  return kind;
}

function ObjectionRow({ objection }: { objection: ObjectionBreakdown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md bg-surface-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm"
      >
        <span className="text-ink">{objection.objectionType}</span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-ink-soft">{objection.count}</span>
          <ChevronDown size={13} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="space-y-1 border-t border-line px-3 pb-2 pt-1.5">
          {objection.calls.length === 0 ? (
            <div className="text-xs text-ink-faint">No call links captured for this objection.</div>
          ) : (
            objection.calls.map((c) => (
              <div key={c.callLink} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-ink-soft">
                  {c.repName} · {c.date}
                </span>
                <a
                  href={c.callLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand hover:underline"
                >
                  Call link <ExternalLink size={10} />
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BreakdownRow({ section }: { section: SectionBreakdown }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-xs">
        <span className="flex items-center gap-1 font-medium text-ink">
          {section.section}
          <ChevronDown size={12} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
        <span className="text-ink-soft">
          {section.weakPct}% ({section.weakCount}/{section.scoredCallCount})
        </span>
      </button>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, section.weakPct)}%` }} />
      </div>
      {open && (
        <div className="mt-2 space-y-2 border-l-2 border-line pl-3">
          {section.examples.length === 0 ? (
            <div className="text-xs text-ink-faint">No calls captured for this step.</div>
          ) : (
            section.examples.map((ex) => (
              <div key={ex.callLink} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">
                    {ex.repName} <span className="font-normal text-ink-faint">· {ex.date}</span>
                  </span>
                  <a
                    href={ex.callLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand hover:underline"
                  >
                    Call link <ExternalLink size={10} />
                  </a>
                </div>
                <ul className="mt-0.5 list-inside list-disc text-ink-soft">
                  {ex.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function QaInsightsDashboard({
  data,
  reps,
}: {
  data: SetterQaInsightsData | null;
  reps: SetterBlock[];
}) {
  const [kind, setKind] = useState<OverallViewKind>("weekly");
  const snapshot = data ? resolveTeamSnapshot(data, kind) : null;

  // Same ranking RepGrid uses (Sets, tie-aware, bottom 2 rank tiers) — so
  // "bottom reps" here always matches what Lee Ann just saw on Per-Rep
  // Performance for this exact view.
  const ranked = rankActiveReps(reps, kind, "sets");
  const bottomRanks = bottomTierRanks(ranked, 2);
  const bottomRepNames = ranked.filter((r) => bottomRanks.has(r.rank) && r.rank !== 1).map((r) => r.rep.name);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-header px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div>
            <Link href="/" className="mb-1 inline-flex items-center gap-1 text-xs text-header-ink-soft hover:text-header-ink">
              <ArrowLeft size={12} /> Back to Setter Performance
            </Link>
            <h1 className="font-serif text-xl font-semibold text-header-ink">Call QA Insights</h1>
            <p className="text-xs text-header-ink-soft">Performance Golf — TMA Internal Setters, Team Philip</p>
          </div>
          {data && (
            <div className="text-right text-xs text-header-ink-soft">
              <div>Bundled snapshot — call QA audit</div>
              <div>Updated {new Date(data.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
        {!data ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-soft">
            No QA insights data available yet.
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-ink">Overall Call QA</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    All setter calls combined — {describeKind(kind)} view, from the QA audit sheet.
                  </p>
                </div>
                <PeriodToggle value={kind} onChange={setKind} />
              </div>

              {!snapshot ? (
                <div className="mt-4 rounded-lg border border-line bg-surface-soft p-4 text-sm text-ink-soft">
                  No QA call data for this {kind === "monthly" ? "month" : kind === "weekly" || kind === "lastWeek" ? "week" : "day"} yet.
                  {(kind === "daily" || kind === "yesterday") && " Call QA audits lag a day or more behind — try Weekly."}
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border-t-2 border-t-brand bg-surface-accent p-4">
                      <div className="font-mono text-2xl font-semibold text-ink">{formatNumber(snapshot.totalCalls)}</div>
                      <div className="text-xs uppercase tracking-wide text-ink-soft">Calls Reviewed</div>
                    </div>
                    <div className="rounded-lg border-t-2 border-t-status-green bg-surface-accent p-4">
                      <div className="font-mono text-2xl font-semibold text-ink">{formatNumber(snapshot.bookedCount)}</div>
                      <div className="text-xs uppercase tracking-wide text-ink-soft">Booked</div>
                    </div>
                    <div className="rounded-lg border-t-2 border-t-status-red bg-surface-accent p-4">
                      <div className="font-mono text-2xl font-semibold text-ink">{formatNumber(snapshot.declinedCount)}</div>
                      <div className="text-xs uppercase tracking-wide text-ink-soft">Declined</div>
                    </div>
                    <div className="rounded-lg border-t-2 border-t-brand bg-surface-accent p-4">
                      <div className="font-mono text-2xl font-semibold text-ink">
                        {snapshot.avgQualityScore != null ? `${snapshot.avgQualityScore}/10` : "—"}
                      </div>
                      <div className="text-xs uppercase tracking-wide text-ink-soft">Avg Quality Score</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-ink-faint">
                    This is a QA sample from the audit sheet, not the authoritative sales numbers — see TMA Internal
                    Setters for those.
                  </p>
                </>
              )}
            </section>

            {snapshot && (
              <>
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
                    <h2 className="font-serif text-xl font-semibold text-ink">Where Calls Break Down</h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      Share of audited calls rated Needs Work or Partial on each script step. Click a step for what
                      actually happened.
                    </p>
                    <div className="mt-4 space-y-3">
                      {snapshot.breakdownBySteps.length === 0 ? (
                        <div className="text-sm text-ink-soft">No QA audits recorded this period.</div>
                      ) : (
                        snapshot.breakdownBySteps.map((s) => <BreakdownRow key={s.section} section={s} />)
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
                    <h2 className="font-serif text-xl font-semibold text-ink">Top Objections</h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      Most common reasons members didn&apos;t book. Click an objection for recent calls.
                    </p>
                    <div className="mt-4 space-y-2">
                      {snapshot.topObjections.length === 0 ? (
                        <div className="text-sm text-ink-soft">No objection data this period.</div>
                      ) : (
                        snapshot.topObjections.map((o) => <ObjectionRow key={o.objectionType} objection={o} />)
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-status-red/30 bg-status-red/5 p-6 shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-status-red">
                    <AlertTriangle size={15} /> Urgent Coaching Needed
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    Lowest-scored audited calls team-wide, {describeKind(kind)} view.
                    {bottomRepNames.length > 0 && ` Bottom-by-Sets reps this view: ${bottomRepNames.join(", ")}.`}
                  </p>
                  <div className="mt-4 space-y-2">
                    {snapshot.urgentCoaching.length === 0 ? (
                      <div className="text-sm text-ink-soft">No scored calls this period.</div>
                    ) : (
                      snapshot.urgentCoaching.map((c) => (
                        <div key={c.callLink} className="rounded-lg border border-line bg-surface p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-xs text-ink-soft">
                              {c.repName} · {c.date}
                              {c.score != null && <span className="font-semibold text-status-red"> · {c.score}/10</span>}
                            </span>
                            <a
                              href={c.callLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                            >
                              Call link <ExternalLink size={11} />
                            </a>
                          </div>
                          <p className="mt-1 text-xs text-ink-soft">{c.reason}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-status-green/30 bg-status-green/5 p-6 shadow-sm">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-status-green">
                    <Trophy size={15} /> Best Practices — Top Performers
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    Highest average call scores this period (min. 2 scored calls) and what they&apos;re doing well.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {snapshot.topPerformers.length === 0 ? (
                      <div className="text-sm text-ink-soft sm:col-span-3">Not enough scored calls yet to identify top performers.</div>
                    ) : (
                      snapshot.topPerformers.map((p, i) => (
                        <div key={p.repName} className="rounded-lg border border-line bg-surface p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-serif text-sm font-semibold text-ink">
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {p.repName}
                            </span>
                            <span className="font-mono text-sm font-semibold text-status-green">{p.avgScore}/10</span>
                          </div>
                          <div className="mt-1 text-[11px] text-ink-faint">{p.callCount} scored calls</div>
                          {p.topHighlight && <p className="mt-1.5 text-xs text-ink-soft">{p.topHighlight}</p>}
                          {p.exampleCallLink && (
                            <a
                              href={p.exampleCallLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                            >
                              Listen to this call <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
