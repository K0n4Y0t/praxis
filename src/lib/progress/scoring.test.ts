import assert from "node:assert/strict";
import { test } from "node:test";
import { LESSON_MAP } from "../curriculum/lessons.ts";
import { isLessonComplete, lessonMastery, semesterAssessment, type ProgressData } from "./scoring.ts";

const empty: ProgressData = { checks: {}, labs: {}, challenges: {}, exam: {}, projects: {} };

test("lesson is not complete until checks and lab pass", () => {
  const lesson = LESSON_MAP.get("s1-cs");
  assert.ok(lesson);
  assert.equal(isLessonComplete(lesson, empty), false);
  const data: ProgressData = {
    ...empty,
    checks: {
      "s1-cs-q1": { tries: 1, correct: true, revealed: false },
      "s1-cs-q2": { tries: 1, correct: true, revealed: false },
    },
    labs: { "s1-cs-lab": { passed: true, solutionSeen: false, hintLevel: 0, attempts: 1 } },
  };
  assert.equal(isLessonComplete(lesson, data), true);
  assert.equal(lessonMastery(lesson, data), 100);
});

test("seeing the solution caps mastery", () => {
  const lesson = LESSON_MAP.get("s1-cs");
  assert.ok(lesson);
  const data: ProgressData = {
    ...empty,
    checks: {
      "s1-cs-q1": { tries: 1, correct: true, revealed: false },
      "s1-cs-q2": { tries: 1, correct: true, revealed: false },
    },
    labs: { "s1-cs-lab": { passed: true, solutionSeen: true, hintLevel: 5, attempts: 2 } },
  };
  const score = lessonMastery(lesson, data);
  assert.ok(score !== null && score <= 35);
});

test("semester total ignores parts that have not started", () => {
  const { total, parts } = semesterAssessment(1, empty);
  assert.equal(total, null);
  assert.ok(parts.some((part) => part.key === "project" && part.weight === 30));
});
