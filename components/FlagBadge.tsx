import { RepFlag } from "@/lib/setter-aggregate";

const LEVEL_STYLES: Record<RepFlag["level"], string> = {
  red: "bg-status-red/10 text-status-red border-status-red/30",
  amber: "bg-status-amber/10 text-status-amber border-status-amber/30",
  green: "bg-status-green/10 text-status-green border-status-green/30",
  gray: "bg-surface-soft text-ink-soft border-line",
};

export default function FlagBadge({ flag }: { flag: RepFlag }) {
  return (
    <span
      title={flag.detail}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[flag.level]}`}
    >
      {flag.label}
    </span>
  );
}
