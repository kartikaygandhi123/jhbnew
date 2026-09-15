const formatter = new Intl.DateTimeFormat("hi-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Returns today's date as an ISO yyyy-mm-dd string in local time. */
export function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Formats an ISO yyyy-mm-dd date as Hindi text, e.g. "15 सितंबर 2026". */
export function hindiDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return formatter.format(date);
}
