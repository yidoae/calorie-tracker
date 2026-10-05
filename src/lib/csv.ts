/** RFC 4180 CSV: fields with commas, quotes or newlines are quoted; quotes are doubled. */

export type CsvValue = string | number | null | undefined;

function field(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // A leading =, +, - or @ makes spreadsheets run a text cell as a formula; neutralise it.
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvValue[][]): string {
  return [header, ...rows].map((row) => row.map(field).join(",")).join("\r\n") + "\r\n";
}
