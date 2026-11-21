export type TrackId =
  | "cs"
  | "programming"
  | "math"
  | "algorithms"
  | "backend"
  | "frontend"
  | "database"
  | "systems"
  | "swe"
  | "devops"
  | "security"
  | "design";

export type Check =
  | {
      id: string;
      kind: "mcq";
      prompt: string;
      choices: string[];
      answer: number;
      explain: string;
    }
  | {
      id: string;
      kind: "short";
      prompt: string;
      accept: string[];
      explain: string;
    };

export type LabTest = {
  name: string;
  stdin?: string;
  expected: string;
  harness?: string;
  /** วาง harness ก่อนโค้ดผู้เรียน เมื่อต้องกำหนดตัวแปรให้ก่อน */
  before?: boolean;
};

export type Lab = {
  id: string;
  prompt: string;
  starter: string;
  tests: LabTest[];
  hints: [string, string, string, string];
  solution: string;
  solutionWhy: string;
};

export type Lesson = {
  id: string;
  semester: number;
  title: string;
  en: string;
  minutes: number;
  tracks: TrackId[];
  prereq: string[];
  objectives: string[];
  prior: string[];
  canDo: string[];
  concept: { heading: string; body: string[] }[];
  example?: { note: string; code: string };
  checks: Check[];
  lab?: Lab;
  summary: string[];
  vocab: { term: string; meaning: string }[];
  pitfalls: string[];
  review: string[];
};

export type PlannedTopic = { en: string; th: string; outcome: string };

export type Semester = {
  id: number;
  title: string;
  en: string;
  span: string;
  summary: string;
  outcomes: string[];
  lessonIds: string[];
  planned: PlannedTopic[];
  projectId: string;
};

export type Project = {
  id: string;
  semester: number;
  title: string;
  problem: string;
  requirements: string[];
  spec: string[];
  tasks: string[];
  milestones: { id: string; label: string }[];
  tests: string[];
  criteria: string[];
  docs: string[];
  review: string[];
  lab?: Lab;
};

export type ChallengeKind = "debug" | "predict" | "find" | "reverse" | "design";

export type Challenge = {
  id: string;
  semester: number;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  kind: ChallengeKind;
  prompt: string;
  code: string;
  stdin?: string;
  accept?: string[];
  tests?: LabTest[];
  hints: [string, string, string, string];
  solution: string;
  why: string;
};

export const TRACKS: { id: TrackId; label: string }[] = [
  { id: "cs", label: "Computer Science" },
  { id: "programming", label: "Programming" },
  { id: "math", label: "Mathematics" },
  { id: "algorithms", label: "Algorithms" },
  { id: "backend", label: "Backend" },
  { id: "frontend", label: "Frontend" },
  { id: "database", label: "Database" },
  { id: "systems", label: "Systems" },
  { id: "swe", label: "Software Engineering" },
  { id: "devops", label: "DevOps" },
  { id: "security", label: "Security" },
  { id: "design", label: "System Design" },
];
