"use client";

import { OverallViewKind } from "@/lib/setter-types";

const OPTIONS: { kind: OverallViewKind; label: string }[] = [
  { kind: "daily", label: "Today" },
  { kind: "yesterday", label: "Yesterday" },
  { kind: "weekly", label: "Weekly" },
  { kind: "lastWeek", label: "Last Week" },
  { kind: "monthly", label: "Monthly" },
];

export default function PeriodToggle({
  value,
  onChange,
}: {
  value: OverallViewKind;
  onChange: (kind: OverallViewKind) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-soft p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.kind}
          onClick={() => onChange(opt.kind)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === opt.kind
              ? "bg-brand text-white shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
