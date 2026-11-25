import type { Lesson } from "./types";
import { DETAIL_S1 } from "./detail-s1.ts";
import { DETAIL_S2 } from "./detail-s2.ts";
import { DETAIL_S3 } from "./detail-s3.ts";
import { DETAIL_S4 } from "./detail-s4.ts";
import { DETAIL_S5 } from "./detail-s5.ts";
import { DETAIL_S6 } from "./detail-s6.ts";
import { DETAIL_S7 } from "./detail-s7.ts";
import { DETAIL_S8 } from "./detail-s8.ts";
import { DETAIL_S9 } from "./detail-s9.ts";
import { DETAIL_S10 } from "./detail-s10.ts";
import { DETAIL_S11 } from "./detail-s11.ts";
import { DETAIL_S12 } from "./detail-s12.ts";

export type LessonDetail = {
  concept: { heading: string; body: string[] }[];
  summary: string[];
  pitfalls: string[];
  review: string[];
  vocab: { term: string; meaning: string }[];
};

export const DETAIL: Record<string, LessonDetail> = {
  ...DETAIL_S1,
  ...DETAIL_S2,
  ...DETAIL_S3,
  ...DETAIL_S4,
  ...DETAIL_S5,
  ...DETAIL_S6,
  ...DETAIL_S7,
  ...DETAIL_S8,
  ...DETAIL_S9,
  ...DETAIL_S10,
  ...DETAIL_S11,
  ...DETAIL_S12,
};

export function deepen(lessons: Lesson[]): Lesson[] {
  return lessons.map((lesson) => {
    const extra = DETAIL[lesson.id];
    if (!extra) return lesson;
    const seen = new Set(lesson.vocab.map((item) => item.term));
    return {
      ...lesson,
      minutes: Math.max(lesson.minutes, 55),
      concept: [...lesson.concept, ...extra.concept],
      summary: [...lesson.summary, ...extra.summary],
      pitfalls: [...lesson.pitfalls, ...extra.pitfalls],
      review: [...lesson.review, ...extra.review],
      vocab: [...lesson.vocab, ...extra.vocab.filter((item) => !seen.has(item.term))],
    };
  });
}
