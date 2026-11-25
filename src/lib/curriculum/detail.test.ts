import assert from "node:assert/strict";
import { test } from "node:test";
import { DETAIL } from "./detail.ts";
import { LESSONS } from "./lessons.ts";

test("every lesson has a slower explanation and keeps its lab", () => {
  assert.equal(LESSONS.length, 127);
  for (const lesson of LESSONS) {
    assert.ok(DETAIL[lesson.id], lesson.id);
    assert.ok(lesson.concept.length >= 4, lesson.id);
    assert.ok(lesson.summary.length >= 4, lesson.id);
    assert.ok(lesson.pitfalls.length >= 3, lesson.id);
    assert.ok(lesson.review.length >= 3, lesson.id);
    const paragraphs = lesson.concept.flatMap((block) => block.body);
    assert.equal(new Set(paragraphs).size, paragraphs.length, lesson.id);
  }
});
