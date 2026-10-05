/** Local-timezone date helpers for the calendar. Weeks start on Monday. */

/** UI language is Turkish; pin it so dates and numbers don't follow the browser locale. */
export const LOCALE = "tr-TR";

/** `YYYY-MM-DD` in the local timezone. */
export function dayKey(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** `YYYY-MM-DD` → local midnight of that day. */
export function dayToDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, count: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + count, 1);
}

/** The month as a Monday-first grid: `null` pads before the 1st and after the last day. */
export function monthGrid(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const index = month.getMonth();
  const leading = (new Date(year, index, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, index + 1, 0).getDate();

  const cells: (Date | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, index, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
