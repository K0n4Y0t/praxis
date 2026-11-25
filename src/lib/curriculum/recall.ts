import { isLessonComplete, type ProgressData } from "../progress/scoring.ts";
import { LESSONS } from "./lessons.ts";
import type { Check, Lesson } from "./types";

export type RecallPick = { lesson: Lesson; check: Check };

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function recallKey(week: string, checkId: string): string {
  return `${week}:${checkId}`;
}

/** ข้อจากบทที่ผ่านแล้วเท่านั้น ชุดเดิมทั้งสัปดาห์ ไม่ปนกับคะแนนบท */
export function retrievalPicks(data: ProgressData, week: string, limit = 4): RecallPick[] {
  const pool: RecallPick[] = [];
  for (const lesson of LESSONS) {
    if (!isLessonComplete(lesson, data)) continue;
    for (const check of lesson.checks) pool.push({ lesson, check });
  }
  pool.sort((a, b) => hash(`${week}:${a.check.id}`) - hash(`${week}:${b.check.id}`));
  return pool.slice(0, limit);
}
