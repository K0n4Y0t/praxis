import assert from "node:assert/strict";
import { test } from "node:test";
import { LESSON_MAP } from "./lessons.ts";
import { retrievalPicks } from "./recall.ts";
import type { ProgressData } from "../progress/scoring.ts";

const empty: ProgressData = { checks: {}, labs: {}, challenges: {}, exam: {}, projects: {} };

test("retrieval waits until a lesson is actually complete", () => {
  assert.deepEqual(retrievalPicks(empty, "2026-11-16"), []);
});

test("retrieval stays inside finished lessons and is stable for a week", () => {
  const lesson = LESSON_MAP.get("s1-cs");
  assert.ok(lesson?.lab);
  const data: ProgressData = {
    ...empty,
    checks: Object.fromEntries(lesson.checks.map((check) => [check.id, { tries: 1, correct: true, revealed: false }])),
    labs: { [lesson.lab.id]: { passed: true, solutionSeen: false, hintLevel: 0, attempts: 1 } },
  };
  const first = retrievalPicks(data, "2026-11-16");
  const again = retrievalPicks(data, "2026-11-16");
  assert.ok(first.length > 0);
  assert.ok(first.every((pick) => pick.lesson.id === "s1-cs"));
  assert.deepEqual(first.map((pick) => pick.check.id), again.map((pick) => pick.check.id));
});
