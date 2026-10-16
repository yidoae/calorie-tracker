import { assertEquals } from "jsr:@std/assert@1";
import { AiUnavailable, type FoodRef, type ModelAnswer } from "../_shared/ai/types.ts";
import { handle, jpegSize, type Claim, type Deps, type Finish } from "./handler.ts";

const KEY = "0b7f1c2e-3d4a-4b5c-8d6e-7f8a9b0c1d2e";
const foods: FoodRef[] = [{ id: "egg", name: "Yumurta", typicalPortionG: 100 }, { id: "simit", name: "Simit", typicalPortionG: 120 }];
const allowance = { used: 1, limit: 5, resets_at: "2026-10-18T00:00:00+03:00" };

/** A JPEG header with an SOF0 frame of the given size, as base64. */
function jpeg(width: number, height: number): string {
  const bytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 0x03, 0, 0, 0, 0, 0, 0];
  return btoa(String.fromCharCode(...bytes));
}

function fakes(opts: { claim?: Claim; model?: () => Promise<ModelAnswer> } = {}) {
  const finished: Finish[] = [];
  let modelCalls = 0;
  const deps: Deps = {
    userId: (token) => Promise.resolve(token === "good" ? "user-1" : null),
    claim: () => Promise.resolve(opts.claim ?? { status: "claimed", id: "row-1" }),
    finish: (_id, f) => {
      finished.push(f);
      return Promise.resolve();
    },
    allowance: () => Promise.resolve(allowance),
    foods: () => Promise.resolve(foods),
    model: () => {
      modelCalls++;
      return opts.model ? opts.model() : Promise.resolve({ text: JSON.stringify({ items: [{ food_id: "egg", grams: 100, estimated: false }], unmatched: [] }), inputTokens: 10, outputTokens: 5 });
    },
    modelName: "fake",
    now: () => 0,
  };
  return { deps, finished, modelCalls: () => modelCalls };
}

const post = (body: unknown, token = "good", headers: Record<string, string> = {}) =>
  new Request("http://x/ai-log", { method: "POST", headers: { authorization: `Bearer ${token}`, ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
const text = (t: string) => ({ request_key: KEY, kind: "text", text: t });

Deno.test("no session → 401 and no model call", async () => {
  const f = fakes();
  const res = await handle(post(text("2 yumurta"), "bad"), f.deps);
  assertEquals([res.status, (await res.json()).error, f.modelCalls()], [401, "not_authenticated", 0]);
});

Deno.test("bad bodies → 400", async () => {
  const f = fakes();
  for (const body of ["{", { request_key: "x", kind: "text", text: "a" }, { request_key: KEY, kind: "video" }, text("   "), text("a".repeat(301))]) {
    assertEquals((await handle(post(body), f.deps)).status, 400, JSON.stringify(body).slice(0, 40));
  }
  assertEquals(f.modelCalls(), 0);
});

Deno.test("over 1.5 MB or 1600 px → 413; not a JPEG → 422", async () => {
  const f = fakes();
  assertEquals((await handle(post(text("a"), "good", { "content-length": "1500001" }), f.deps)).status, 413);
  assertEquals((await handle(post({ request_key: KEY, kind: "photo", image: jpeg(2000, 1000) }), f.deps)).status, 413);
  const bad = await handle(post({ request_key: KEY, kind: "photo", image: btoa("not a jpeg") }), f.deps);
  assertEquals([bad.status, (await bad.json()).error], [422, "bad_image"]);
});

Deno.test("a used-up allowance → 429 with the reset time, no model call", async () => {
  const f = fakes({ claim: { status: "limit_reached", resets_at: allowance.resets_at } });
  const res = await handle(post(text("2 yumurta")), f.deps);
  assertEquals([res.status, await res.json(), f.modelCalls()], [429, { error: "limit_reached", resets_at: allowance.resets_at }, 0]);
});

Deno.test("a repeated key returns the stored body without a model call", async () => {
  const result = { items: [{ food_id: "egg", grams: 100, estimated: false }], unmatched: [] };
  const f = fakes({ claim: { status: "existing", id: "row-1", row_status: "counted", result, error: null } });
  const res = await handle(post(text("2 yumurta")), f.deps);
  assertEquals([res.status, await res.json(), f.modelCalls(), f.finished.length], [200, { ...result, allowance }, 0, 0]);
  const released = fakes({ claim: { status: "existing", id: "row-1", row_status: "released", result: null, error: "no_food" } });
  assertEquals((await handle(post(text("x")), released.deps)).status, 422);
});

Deno.test("success counts the attempt and returns the contract body", async () => {
  const f = fakes();
  const res = await handle(post({ request_key: KEY, kind: "photo", image: jpeg(1024, 768) }), f.deps);
  assertEquals([res.status, await res.json()], [200, { items: [{ food_id: "egg", grams: 100, estimated: false }], unmatched: [], allowance }]);
  assertEquals(f.finished.map((x) => [x.status, x.inputTokens, x.outputTokens, x.model]), [["counted", 10, 5, "fake"]]);
});

Deno.test("model failure, timeout or no food release the attempt", async () => {
  const down = fakes({ model: () => Promise.reject(new AiUnavailable("timeout")) });
  const r1 = await handle(post(text("2 yumurta")), down.deps);
  assertEquals([r1.status, (await r1.json()).error, down.finished[0].status, down.finished[0].error], [503, "ai_unavailable", "released", "ai_unavailable"]);

  const garbage = fakes({ model: () => Promise.resolve({ text: "nope", inputTokens: 1, outputTokens: 1 }) });
  assertEquals((await handle(post(text("2 yumurta")), garbage.deps)).status, 503);

  const empty = fakes({ model: () => Promise.resolve({ text: JSON.stringify({ items: [], unmatched: [{ description: "duvar" }] }), inputTokens: 1, outputTokens: 1 }) });
  const r3 = await handle(post(text("duvar")), empty.deps);
  assertEquals([r3.status, (await r3.json()).error, empty.finished[0].status], [422, "no_food", "released"]);
});

Deno.test("jpegSize reads the frame size and rejects other bytes", () => {
  const bytes = Uint8Array.from(atob(jpeg(640, 480)), (c) => c.charCodeAt(0));
  assertEquals(jpegSize(bytes), { width: 640, height: 480 });
  assertEquals(jpegSize(new Uint8Array([1, 2, 3, 4])), null);
});
