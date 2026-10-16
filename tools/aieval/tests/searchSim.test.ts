import assert from "node:assert/strict";
import { test } from "node:test";
import { searchQuery } from "@calorie/core/search/normalize";
import searchCases from "../../fooddata/sources/search-cases.ts";
import { loadFoods } from "../src/cases.ts";
import { makeSearch } from "../src/searchSim.ts";

// The committed search cases pass first on dev (search_cases.test.sql); the simulation must agree.
test("the simulated search ranks every committed search case first", () => {
  const search = makeSearch(loadFoods());
  const misses = searchCases.filter((c) => search(searchQuery(c.query), 1)[0]?.foodId !== c.expectedId).map((c) => c.query);
  assert.deepEqual(misses, []);
});
