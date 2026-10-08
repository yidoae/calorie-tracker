/** llama3.2 occasionally echoes its role label ("assistant\n\n…") at the start of the reply. */
export function cleanReply(raw: string): string {
  return raw.replace(/^\s*assistant\s*\n+/i, "").trim();
}

/**
 * Decides, while a reply streams in, how much of it can be shown. Text waits until it's clear it
 * isn't the echoed "assistant" label, and a reply that opens like JSON or a code fence is held
 * back entirely: llama3.2 sometimes writes a tool call as text, which must never reach the user.
 * `push` returns the newly showable text (possibly empty).
 */
export class ReplyGate {
  private raw = "";
  private shownLength = 0;
  private state: "pending" | "open" | "held" = "pending";

  /** Whether any text has been released. */
  get shown(): boolean {
    return this.shownLength > 0;
  }

  push(delta: string): string {
    this.raw += delta;
    if (this.state === "held") return "";
    const text = this.raw.replace(/^\s*assistant\s*\n+/i, "").trimStart();
    if (this.state === "pending") {
      const head = this.raw.trimStart().toLowerCase();
      // "assist…" or "assistant   " could still turn into the label; wait for the next token.
      if ("assistant".startsWith(head) || /^assistant\s*$/.test(head)) return "";
      if (!text) return "";
      if (text.startsWith("{") || text.startsWith("`")) {
        this.state = "held";
        return "";
      }
      this.state = "open";
    }
    const out = text.slice(this.shownLength);
    this.shownLength = text.length;
    return out;
  }
}
