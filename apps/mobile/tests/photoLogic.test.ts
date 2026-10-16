import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PHOTO_MAX_SIDE, resizeTarget } from "../src/hooks/photoLogic.ts";

describe("photo size before sending (003 FR-002)", () => {
  it("puts the long edge at 1024 and keeps the aspect", () => {
    assert.deepEqual(resizeTarget(4032, 3024), { width: PHOTO_MAX_SIDE });
    assert.deepEqual(resizeTarget(3024, 4032), { height: PHOTO_MAX_SIDE });
  });

  it("never upscales, but still re-encodes small photos", () => {
    assert.equal(resizeTarget(800, 600), null);
    assert.equal(resizeTarget(1024, 1024), null);
  });
});
