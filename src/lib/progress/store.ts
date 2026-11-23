import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bangkokDate } from "./dates";
import type { Attempt, LabState, ProgressData } from "./scoring";

type Note = { id: string; title: string; body: string; at: string };
type Mistake = { id: string; title: string; error: string; cause: string; fix: string; learned: string; at: string };
type Snippet = { id: string; title: string; code: string; at: string };
type Entry = { id: string; body: string; at: string };

type ProgressState = ProgressData & {
  notes: Note[];
  mistakes: Mistake[];
  snippets: Snippet[];
  journal: Entry[];
  bookmarks: string[];
  secondsByDay: Record<string, number>;
  planByDay: Record<string, string[]>;
  doneOn: Record<string, string>;
  hydrated: boolean;
  markHydrated: () => void;
  markDone: (lessonId: string) => void;
  answerCheck: (id: string, correct: boolean, bucket?: "checks" | "exam") => void;
  recordRun: (id: string, bucket: "labs" | "challenges", passed: boolean) => void;
  openHint: (id: string, bucket: "labs" | "challenges", level: number) => void;
  revealSolution: (id: string, bucket: "labs" | "challenges") => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  addSeconds: (seconds: number) => void;
  togglePlan: (blockId: string) => void;
  toggleBookmark: (lessonId: string) => void;
  addNote: (title: string, body: string) => void;
  addMistake: (m: Omit<Mistake, "id" | "at">) => void;
  addSnippet: (title: string, code: string) => void;
  addJournal: (body: string) => void;
  removeEntry: (bucket: "notes" | "mistakes" | "snippets" | "journal", id: string) => void;
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function bumpLab(current: LabState | undefined, patch: Partial<LabState>): LabState {
  return {
    passed: current?.passed ?? false,
    solutionSeen: current?.solutionSeen ?? false,
    hintLevel: current?.hintLevel ?? 0,
    attempts: current?.attempts ?? 0,
    ...patch,
  };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      checks: {},
      labs: {},
      challenges: {},
      exam: {},
      projects: {},
      notes: [],
      mistakes: [],
      snippets: [],
      journal: [],
      bookmarks: [],
      secondsByDay: {},
      planByDay: {},
      doneOn: {},
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),
      markDone: (lessonId) =>
        set((state) => {
          if (state.doneOn?.[lessonId]) return state;
          return { doneOn: { ...(state.doneOn ?? {}), [lessonId]: bangkokDate() } };
        }),
      answerCheck: (id, correct, bucket = "checks") =>
        set((state) => {
          const prev = state[bucket][id] ?? { tries: 0, correct: false, revealed: false };
          const tries = prev.tries + 1;
          const next: Attempt = {
            tries,
            correct: prev.correct || correct,
            revealed: prev.revealed || (!correct && tries >= 3),
          };
          return { [bucket]: { ...state[bucket], [id]: next } };
        }),
      recordRun: (id, bucket, passed) =>
        set((state) => {
          const prev = state[bucket][id];
          const next = bumpLab(prev, {
            attempts: prev?.passed ? prev.attempts : (prev?.attempts ?? 0) + 1,
            passed: prev?.passed || passed,
          });
          return { [bucket]: { ...state[bucket], [id]: next } };
        }),
      openHint: (id, bucket, level) =>
        set((state) => {
          const prev = state[bucket][id];
          const next = bumpLab(prev, { hintLevel: Math.max(prev?.hintLevel ?? 0, level) });
          return { [bucket]: { ...state[bucket], [id]: next } };
        }),
      revealSolution: (id, bucket) =>
        set((state) => {
          const prev = state[bucket][id];
          const next = bumpLab(prev, { solutionSeen: true, hintLevel: 5 });
          return { [bucket]: { ...state[bucket], [id]: next } };
        }),
      toggleMilestone: (projectId, milestoneId) =>
        set((state) => {
          const cur = state.projects[projectId] ?? [];
          const next = cur.includes(milestoneId) ? cur.filter((id) => id !== milestoneId) : [...cur, milestoneId];
          return { projects: { ...state.projects, [projectId]: next } };
        }),
      addSeconds: (seconds) =>
        set((state) => {
          const day = bangkokDate();
          const prev = state.secondsByDay[day] ?? 0;
          if (prev > 60 * 60 * 6) return state;
          return { secondsByDay: { ...state.secondsByDay, [day]: prev + seconds } };
        }),
      togglePlan: (blockId) =>
        set((state) => {
          const day = bangkokDate();
          const cur = state.planByDay[day] ?? [];
          const next = cur.includes(blockId) ? cur.filter((id) => id !== blockId) : [...cur, blockId];
          return { planByDay: { ...state.planByDay, [day]: next } };
        }),
      toggleBookmark: (lessonId) =>
        set((state) => ({
          bookmarks: state.bookmarks.includes(lessonId)
            ? state.bookmarks.filter((id) => id !== lessonId)
            : [...state.bookmarks, lessonId],
        })),
      addNote: (title, body) =>
        set((state) => ({ notes: [{ id: uid(), title, body, at: new Date().toISOString() }, ...state.notes] })),
      addMistake: (m) =>
        set((state) => ({ mistakes: [{ ...m, id: uid(), at: new Date().toISOString() }, ...state.mistakes] })),
      addSnippet: (title, code) =>
        set((state) => ({ snippets: [{ id: uid(), title, code, at: new Date().toISOString() }, ...state.snippets] })),
      addJournal: (body) =>
        set((state) => ({ journal: [{ id: uid(), body, at: new Date().toISOString() }, ...state.journal] })),
      removeEntry: (bucket, id) =>
        set((state) => ({ [bucket]: state[bucket].filter((item) => item.id !== id) })),
    }),
    {
      name: "praxis-progress-v1",
      skipHydration: true,
      partialize: (state) => ({
        checks: state.checks,
        labs: state.labs,
        challenges: state.challenges,
        exam: state.exam,
        projects: state.projects,
        notes: state.notes,
        mistakes: state.mistakes,
        snippets: state.snippets,
        journal: state.journal,
        bookmarks: state.bookmarks,
        secondsByDay: state.secondsByDay,
        planByDay: state.planByDay,
        doneOn: state.doneOn ?? {},
      }),
    },
  ),
);
