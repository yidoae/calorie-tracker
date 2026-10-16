import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowanceLine, canAnalyse } from "../src/hooks/allowanceLogic.ts";

const at = (used: number) => ({ used, limit: 5, resetsAt: "2026-10-17T21:00:00Z" });

describe("AI allowance line (003 FR-015)", () => {
  it("counts down what is left", () => {
    assert.equal(allowanceLine(at(0), "Europe/Istanbul"), "Bugün 5 AI kaydın kaldı");
    assert.equal(allowanceLine(at(4), "Europe/Istanbul"), "Bugün 1 AI kaydın kaldı");
  });

  it("says when a used-up allowance comes back, in the user's time", () => {
    assert.equal(allowanceLine(at(5), "Europe/Istanbul"), "Bugünlük AI hakkın bitti, 00:00'da yenilenir");
    assert.equal(allowanceLine(at(6), "UTC"), "Bugünlük AI hakkın bitti, 21:00'da yenilenir");
  });

  it("stays quiet while loading", () => {
    assert.equal(allowanceLine(null, "Europe/Istanbul"), null);
  });

  it("analysis is allowed while something is left or the count is unknown", () => {
    assert.equal(canAnalyse(at(4)), true);
    assert.equal(canAnalyse(at(5)), false);
    assert.equal(canAnalyse(null), true, "the server still enforces the limit");
  });
});
