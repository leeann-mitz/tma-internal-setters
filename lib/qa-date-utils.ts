// Shared date-bucketing helpers for the QA audit pipeline — bucket by
// actual calendar day / Monday-start week / calendar month using the same
// logic the sheet-backed dashboard's own "WB MM/DD" convention uses, so
// period labels line up with each other.

export function toMonthDay(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

export function weekBeginningLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  const mm = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(monday.getUTCDate()).padStart(2, "0");
  return `WB ${mm}/${dd}`;
}

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(dateStr: string): string {
  const [, m] = dateStr.split("-");
  return MONTH_NAMES[parseInt(m, 10) - 1];
}

export function todayLabel(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function yesterdayLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}
