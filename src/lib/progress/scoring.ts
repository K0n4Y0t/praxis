import { CHALLENGES } from "../curriculum/challenges.ts";
import { examForSemester } from "../curriculum/exam.ts";
import { LESSON_MAP, LESSONS } from "../curriculum/lessons.ts";
import { PROJECTS } from "../curriculum/projects.ts";
import { SEMESTERS } from "../curriculum/semesters.ts";
import { TRACKS, type Lesson, type TrackId } from "../curriculum/types.ts";

export type Attempt = { tries: number; correct: boolean; revealed: boolean };

export type LabState = {
  passed: boolean;
  solutionSeen: boolean;
  hintLevel: number;
  attempts: number;
};

export type ProgressData = {
  checks: Record<string, Attempt>;
  labs: Record<string, LabState>;
  challenges: Record<string, LabState>;
  exam: Record<string, Attempt>;
  projects: Record<string, string[]>;
};

export function isLessonComplete(lesson: Lesson, data: ProgressData, seen = new Set<string>()): boolean {
  if (seen.has(lesson.id)) return false;
  seen.add(lesson.id);
  for (const id of lesson.prereq) {
    const prior = LESSON_MAP.get(id);
    if (!prior || !isLessonComplete(prior, data, seen)) return false;
  }
  const checksOk = lesson.checks.every((check) => {
    const attempt = data.checks[check.id];
    return !!attempt && (attempt.correct || attempt.revealed);
  });
  if (!checksOk) return false;
  if (lesson.lab && !data.labs[lesson.lab.id]?.passed) return false;
  return true;
}

export function lessonMastery(lesson: Lesson, data: ProgressData): number | null {
  if (!isLessonComplete(lesson, data)) return null;
  let score = 100;
  const lab = lesson.lab ? data.labs[lesson.lab.id] : undefined;
  if (lab) {
    score -= lab.hintLevel * 8;
    score -= Math.max(0, lab.attempts - 1) * 4;
    if (lab.solutionSeen) score = Math.min(score, 35);
  }
  for (const check of lesson.checks) {
    const attempt = data.checks[check.id];
    if (!attempt) continue;
    if (attempt.revealed && !attempt.correct) score -= 8;
    else if (attempt.tries > 1) score -= 4;
  }
  return Math.max(0, Math.min(100, score));
}

export function trackProgress(data: ProgressData): { id: TrackId; label: string; done: number; total: number; mastery: number | null }[] {
  return TRACKS.map((track) => {
    const lessons = LESSONS.filter((lesson) => lesson.tracks.includes(track.id));
    const doneLessons = lessons.filter((lesson) => isLessonComplete(lesson, data));
    const scores = doneLessons.map((lesson) => lessonMastery(lesson, data)).filter((n): n is number => n !== null);
    return {
      id: track.id,
      label: track.label,
      done: doneLessons.length,
      total: lessons.length,
      mastery: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    };
  });
}

export type PartScore = { key: string; label: string; weight: number; score: number | null; note: string };

export function semesterAssessment(semesterId: number, data: ProgressData): { parts: PartScore[]; total: number | null } {
  const semester = SEMESTERS.find((item) => item.id === semesterId);
  const lessons = LESSONS.filter((lesson) => lesson.semester === semesterId);
  const project = PROJECTS.find((item) => item.semester === semesterId);
  const exam = examForSemester(semesterId);
  const examAnswered = exam.filter((item) => data.exam[item.id]);
  const theory =
    exam.length === 0
      ? null
      : examAnswered.length < exam.length
        ? null
        : Math.round((exam.filter((item) => data.exam[item.id]?.correct).length / exam.length) * 100);

  const checkIds = lessons.flatMap((lesson) => lesson.checks.map((check) => check.id));
  const answeredChecks = checkIds.filter((id) => data.checks[id]);
  const exercises =
    checkIds.length === 0
      ? null
      : answeredChecks.length === 0
        ? null
        : Math.round((checkIds.filter((id) => data.checks[id]?.correct).length / checkIds.length) * 100);

  const labs = lessons.flatMap((lesson) => (lesson.lab ? [lesson.lab.id] : []));
  if (project?.lab) labs.push(project.lab.id);
  const labScores =
    labs.length === 0
      ? null
      : labs.every((id) => !data.labs[id])
        ? null
        : Math.round((labs.filter((id) => data.labs[id]?.passed).length / labs.length) * 100);

  const milestoneIds = project?.milestones.map((m) => m.id) ?? [];
  const marked = new Set(data.projects[project?.id ?? ""] ?? []);
  const projectScore =
    milestoneIds.length === 0 ? null : marked.size === 0 ? null : Math.round((milestoneIds.filter((id) => marked.has(id)).length / milestoneIds.length) * 100);

  const debugIds = CHALLENGES.filter((c) => c.semester === semesterId).map((c) => c.id);
  const debugTouched = debugIds.filter((id) => data.challenges[id]);
  const debugScore =
    debugIds.length === 0
      ? null
      : debugTouched.length === 0
        ? null
        : Math.round((debugIds.filter((id) => data.challenges[id]?.passed && !data.challenges[id]?.solutionSeen).length / debugIds.length) * 100);

  const parts: PartScore[] = [
    {
      key: "theory",
      label: "ทฤษฎี",
      weight: 15,
      score: theory,
      note: exam.length ? "ข้อสอบทฤษฎีของภาคนี้" : "ยังไม่มีข้อสอบที่ตรวจอัตโนมัติในภาคนี้",
    },
    {
      key: "exercises",
      label: "แบบฝึก",
      weight: 20,
      score: exercises,
      note: checkIds.length ? "คำถามระหว่างบท" : "ยังไม่มีแบบฝึกที่ตรวจได้",
    },
    {
      key: "labs",
      label: "งานโปรแกรม",
      weight: 20,
      score: labScores,
      note: labs.length ? "แล็บที่ตัวตรวจรันให้" : "แล็บที่ตรวจอัตโนมัติยังไม่เปิด",
    },
    {
      key: "project",
      label: "โครงงาน",
      weight: 30,
      score: projectScore,
      note: "หลักไมล์เป็นการติ๊กเองว่างานบนเครื่องคุณทำแล้ว ฟังก์ชันแกนที่ตัวตรวจรันอยู่ในช่องงานโปรแกรม",
    },
    {
      key: "debug",
      label: "อธิบายและดีบัก",
      weight: 15,
      score: debugScore,
      note: debugIds.length ? "โจทย์ฝึกของภาคนี้ที่ผ่านโดยไม่เปิดเฉลยเต็ม" : "ชุดดีบักของภาคนี้ยังไม่เปิด",
    },
  ];

  const active = parts.filter((part) => part.score !== null);
  if (!active.length || !semester) return { parts, total: null };
  const weight = active.reduce((sum, part) => sum + part.weight, 0);
  const total = Math.round(active.reduce((sum, part) => sum + (part.score ?? 0) * part.weight, 0) / weight);
  return { parts, total };
}

export function weakLessons(data: ProgressData): Lesson[] {
  return LESSONS.filter((lesson) => {
    const lab = lesson.lab ? data.labs[lesson.lab.id] : undefined;
    if (lab && lab.attempts > 0 && !lab.passed) return true;
    return lesson.checks.some((check) => {
      const attempt = data.checks[check.id];
      return attempt && !attempt.correct && attempt.tries >= 2;
    });
  });
}

export function continuation(data: ProgressData): Lesson {
  return LESSONS.find((lesson) => !isLessonComplete(lesson, data)) ?? LESSONS[LESSONS.length - 1];
}
