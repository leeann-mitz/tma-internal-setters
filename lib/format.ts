export function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatPercent(value: number | null): string {
  if (value == null) return "—";
  return `${value.toFixed(0)}%`;
}

export function formatNumber(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

export function formatDelta(deltaPct: number | null): string {
  if (deltaPct == null) return "";
  const sign = deltaPct > 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(0)}%`;
}

export const HIGH_SHOW_RATE_THRESHOLD = 55;

/** Green above the threshold, red below it, plain exactly at it. */
export function rateClass(value: number | null, threshold = HIGH_SHOW_RATE_THRESHOLD): string {
  if (value == null) return "";
  if (value > threshold) return "text-status-green font-semibold";
  if (value < threshold) return "text-status-red font-semibold";
  return "";
}
