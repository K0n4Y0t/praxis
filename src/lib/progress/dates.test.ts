import assert from "node:assert/strict";
import { test } from "node:test";
import { mondayOf, secondsInDays, weekDays } from "./dates.ts";

test("week starts on Monday in the stored calendar dates", () => {
  assert.equal(mondayOf("2026-11-21"), "2026-11-16");
  assert.equal(mondayOf("2026-11-16"), "2026-11-16");
  assert.equal(mondayOf("2026-11-22"), "2026-11-16");
  assert.deepEqual(weekDays("2026-11-16"), [
    "2026-11-16",
    "2026-11-17",
    "2026-11-18",
    "2026-11-19",
    "2026-11-20",
    "2026-11-21",
    "2026-11-22",
  ]);
});

test("seconds add only the days in the week", () => {
  const seconds = secondsInDays({ "2026-11-16": 120, "2026-11-15": 999, "2026-11-22": 60 }, weekDays("2026-11-16"));
  assert.equal(seconds, 180);
});
