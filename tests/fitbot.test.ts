import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTurkish } from "@/server/fitbot/prompt";
import { cleanReply, ReplyGate } from "@/server/fitbot/stream";

describe("FitBot: Turkish detection", () => {
  it("spots Turkish by its letters or common words, even typed without Turkish letters", () => {
    assert.equal(isTurkish("Günde ne kadar protein almalıyım?"), true);
    assert.equal(isTurkish("Merhaba!"), true);
    assert.equal(isTurkish("gunde kac kalori almaliyim"), true);
    assert.equal(isTurkish("100 gram yag kac kalori"), true);
  });

  it("leaves English alone", () => {
    assert.equal(isTurkish("How much protein should I eat per day?"), false);
    assert.equal(isTurkish("Hi!"), false);
    assert.equal(isTurkish("What's the capital of France?"), false);
  });
});

describe("FitBot: streamed reply gate", () => {
  const stream = (chunks: string[]) => {
    const gate = new ReplyGate();
    return { shown: chunks.map((c) => gate.push(c)).join(""), gate };
  };

  it("releases ordinary text as it arrives", () => {
    const gate = new ReplyGate();
    assert.equal(gate.push("Günde "), "Günde ");
    assert.equal(gate.push("162 g"), "162 g");
    assert.equal(gate.shown, true);
  });

  it("drops an echoed role label, even split across tokens", () => {
    assert.equal(stream(["assist", "ant", "\n\n", "Merhaba!"]).shown, "Merhaba!");
    assert.equal(cleanReply("assistant\n\nMerhaba! "), "Merhaba!");
  });

  it("keeps words that only start like the label", () => {
    assert.equal(stream(["A", " good", " plan"]).shown, "A good plan");
    assert.equal(stream(["Assistants", " help"]).shown, "Assistants help");
  });

  it("holds back replies that look like a tool call written as text", () => {
    const json = stream(['{"name": ', '"calculate_targets"}']);
    assert.equal(json.shown, "");
    assert.equal(json.gate.shown, false);
    assert.equal(stream(["```json\n", "{}"]).shown, "");
  });
});
