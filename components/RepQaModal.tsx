"use client";

import { useEffect } from "react";
import { RepQaInsights } from "@/lib/setter-qa-types";
import { X, ExternalLink, AlertTriangle, Target } from "lucide-react";

export default function RepQaModal({
  repName,
  insights,
  sourcePeriodLabel,
  onClose,
}: {
  repName: string;
  insights: RepQaInsights | null;
  sourcePeriodLabel: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-line bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">{repName}</h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              Call QA audit{sourcePeriodLabel ? ` (${sourcePeriodLabel})` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-ink-soft hover:bg-surface-soft hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {!insights ? (
          <div className="mt-5 rounded-lg border border-line bg-surface-soft p-4 text-sm text-ink-soft">
            No call QA data available for this rep yet — either no audited calls were found in the source data, or
            their calls haven&apos;t been matched to this roster name yet.
          </div>
        ) : insights.calls.length === 0 ? (
          <div className="mt-5 rounded-lg border border-status-green/30 bg-status-green/5 p-4 text-sm text-ink">
            No audited calls in this period.
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border-t-2 border-t-brand bg-surface-accent p-3">
                <div className="font-mono text-lg font-semibold text-ink">{insights.callCount}</div>
                <div className="text-[11px] text-ink-soft">Audited calls</div>
              </div>
              <div className="rounded-lg border-t-2 border-t-brand bg-surface-accent p-3">
                <div className="font-mono text-lg font-semibold text-ink">
                  {insights.averageScore != null ? `${insights.averageScore}/10` : "—"}
                </div>
                <div className="text-[11px] text-ink-soft">Avg quality score</div>
              </div>
              <div className="rounded-lg border-t-2 border-t-brand bg-surface-accent p-3">
                <div className="font-mono text-lg font-semibold text-ink">{insights.scoredCallCount}</div>
                <div className="text-[11px] text-ink-soft">Calls scored</div>
              </div>
            </div>

            {insights.topOpportunities.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <Target size={13} /> Top Opportunities
                </div>
                <ul className="mt-2 space-y-1">
                  {insights.topOpportunities.map((o) => (
                    <li key={o.step} className="flex items-center justify-between rounded-md bg-surface-soft px-3 py-1.5 text-sm">
                      <span className="text-ink">{o.step}</span>
                      <span className="font-mono text-xs text-ink-soft">{o.count} call{o.count === 1 ? "" : "s"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.urgentAction && (
              <div className="mt-5 rounded-lg border border-status-red/30 bg-status-red/5 p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-status-red">
                  <AlertTriangle size={13} /> Urgent Action Plan
                </div>
                <p className="mt-1.5 text-sm text-ink">{insights.urgentAction.detail}</p>
                <a
                  href={insights.urgentAction.callLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  Listen to this call ({insights.urgentAction.score}/10) <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">All audited calls</div>
              <div className="mt-2 space-y-2">
                {insights.calls.map((c) => (
                  <div key={c.callLink} className="rounded-lg border border-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
                      <span>
                        {c.auditDate} · {c.disposition}
                      </span>
                      <a
                        href={c.callLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                      >
                        Call link <ExternalLink size={11} />
                      </a>
                    </div>
                    {c.overallQualityScore != null ? (
                      <div className="mt-1.5 flex items-center gap-2 text-sm">
                        <span className="font-mono font-semibold text-ink">{c.overallQualityScore}/10</span>
                        {c.objectionType && <span className="text-xs text-ink-soft">{c.objectionType}</span>}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-xs text-ink-faint">No score recorded for this call.</p>
                    )}
                    {c.opportunities.length > 0 && (
                      <p className="mt-1 text-xs text-ink-soft">{c.opportunities[0]}</p>
                    )}
                    {c.highlights.length > 0 && (
                      <p className="mt-1 text-xs text-status-green">{c.highlights[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
