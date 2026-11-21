import { CHALLENGES } from "./challenges";
import { LESSONS, LESSON_MAP } from "./lessons";
import { PROJECT_MAP, PROJECTS } from "./projects";
import { SEMESTERS } from "./semesters";
import type { Lesson, Semester } from "./types";

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP.get(id);
}

export function getSemester(id: number): Semester | undefined {
  return SEMESTERS.find((semester) => semester.id === id);
}

export function lessonsInSemester(id: number): Lesson[] {
  const semester = getSemester(id);
  if (!semester) return [];
  return semester.lessonIds.map((lessonId) => LESSON_MAP.get(lessonId)).filter((lesson): lesson is Lesson => !!lesson);
}

export function nextLesson(id: string): Lesson | undefined {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return index >= 0 ? LESSONS[index + 1] : undefined;
}

export function prevLesson(id: string): Lesson | undefined {
  const index = LESSONS.findIndex((lesson) => lesson.id === id);
  return index > 0 ? LESSONS[index - 1] : undefined;
}

export { CHALLENGES, LESSONS, PROJECTS, PROJECT_MAP, SEMESTERS };
