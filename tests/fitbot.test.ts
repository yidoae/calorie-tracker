import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTurkish } from "@/server/fitbot/prompt";

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
