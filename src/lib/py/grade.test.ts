import assert from "node:assert/strict";
import { test } from "node:test";
import { CHALLENGES } from "../curriculum/challenges.ts";
import { LESSONS } from "../curriculum/lessons.ts";
import { PROJECTS } from "../curriculum/projects.ts";
import { allPassed, gradeCode } from "./grade.ts";
import { runPython } from "./run.ts";

test("every published solution passes its own tests", () => {
  const labs = [
    ...LESSONS.filter((lesson) => lesson.lab).map((lesson) => lesson.lab!),
    ...PROJECTS.filter((project) => project.lab).map((project) => project.lab!),
    ...CHALLENGES.filter((challenge) => challenge.tests).map((challenge) => ({
      id: challenge.id,
      solution: challenge.solution,
      tests: challenge.tests!,
    })),
  ];
  for (const lab of labs) {
    const graded = gradeCode(lab.solution, lab.tests);
    assert.equal(allPassed(graded), true, `${lab.id} ${graded.map((g) => g.name + ":" + g.actual + ":" + g.error?.message).join(" | ")}`);
  }
});

test("lesson examples run", () => {
  for (const lesson of LESSONS) {
    if (!lesson.example) continue;
    const result = runPython(lesson.example.code);
    assert.equal(result.error, null, `${lesson.id} ${result.error?.message}`);
  }
});
