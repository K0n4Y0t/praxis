# Praxis

Private snapshot of a self-study software engineering academy. The product speaks Thai and keeps technical terms in English. This repository's docs, commit messages, and issue text stay in English.

The learner starts with no programming background and is meant to reach someone who can design, test, and operate a system. Target pace is about two hours a day over 36–48 months, on a home Ubuntu box with about 16 GB of RAM that cannot be upgraded.

## What is done

The app is a single modular web app (React, TypeScript, Vite, TanStack Start). Progress lives in the browser. There is no account and no database of learners yet.

Shipped and usable:

- Dashboard with a two-hour daily plan, study streak (Asia/Bangkok), and the next unfinished lesson
- Twelve semesters, 127 lessons. Each lesson has objectives, prerequisites, a Thai concept explanation, an editable example, checks that do not reveal the answer immediately, a lab with automated tests, a summary, vocabulary, pitfalls, and a completion rule
- In-browser Python subset runner: syntax highlighting, run, reset, stdin, stdout, step limit, no `import`, no filesystem, no server-side `eval`. Errors are explained from the real error name
- Practice set for every semester: debug, predict-the-output, find-the-bug, reverse, and design. Five hint levels. Seeing the full solution caps mastery
- Twelve semester projects. Semester 1 grades a `balance` function. Later projects are milestone checklists the learner marks themselves
- One theory exam per semester, plus a weighted score that ignores parts the learner has not started
- Notebook, glossary from opened lessons, mistake journal, and code snippets
- Light and dark theme, phone and desktop layout

Score weights, applied only to parts that have been started:

| Part | Weight |
| --- | --- |
| Theory exam | 15% |
| In-lesson checks | 20% |
| Auto-graded labs | 20% |
| Project (self-attested milestones) | 30% |
| Debug practice passed without the full solution | 15% |

Intended pass mark is 75, and the project still has to be real work, not only an exam. There is no human reviewer in this snapshot.

Curriculum checks that were run against this snapshot: every published lab solution and every challenge with tests passes its own harness, and `tsc --noEmit` is clean. The broader `npm test` script also runs platform UI tests that are not part of the academy; those are not a claim about lesson correctness.

## What is next

Do these before adding more surface area:

1. Separate accounts and Postgres only when progress must follow the learner across devices. Hash passwords, scope every row by the signed-in user, and keep secrets out of git
2. A real isolated runner, as its own process with CPU, RAM, and time limits, when a lesson needs C, SQL, JavaScript, TypeScript, or a shell. Do not start with Kubernetes
3. Docker Compose with memory caps, backup, and a restore drill for the home server
4. Keep hint ladders working with no external AI. An outside tutor, if added later, must be opt-in and must not invent run results

## Still to do

These are real gaps. The app does not pretend they exist.

- Semesters 2–12 do not execute Linux, Git, C, Java, SQL, TypeScript, Docker, or a network stack. Those labs are Python models of the idea, and each lesson says so
- No server sandbox, so there is no claim of server-grade isolation
- No external AI tutor. Hints are written into the lesson
- No login, no Postgres, no sync across devices. Browser storage is readable by anyone who uses that browser profile. Do not put secrets in the notebook
- Project points are self-attested ticks, except the semester 1 lab. There is no reviewer and no separate midterm besides the one theory exam per semester
- Home-server packaging is not in this tree: no Compose file, no backup job, no rate limit, no auth
- Passing a lab means the written tests matched. It does not mean the learner is correct for every case

## Why this stack

A modular monolith stays inside a 16 GB machine with one learner. Splitting FastAPI, Postgres, and a runner into separate services on day one spends RAM before there is a second user.

The runner stays in the page, so student code never reaches an application server. It caps steps and refuses files and imports. The in-app handbook states that limit in Thai.

Later path, not this snapshot:

1. Accounts and Postgres when progress must move between devices
2. A separate runner process with CPU, RAM, and time limits when the Python subset is not enough
3. Docker Compose with a memory ceiling. Not Kubernetes first
4. Backup, a restore drill, and secrets outside git

## Layout

```text
src/routes/            lesson, curriculum, playground, projects, progress
src/lib/curriculum/    lessons by semester, projects, challenges, exams
src/lib/py/            Python subset runner and the grader
src/lib/progress/      on-device progress and the score formula
src/components/        shell, editor, lab runner
```

Add a lesson by putting it in the semester file under `src/lib/curriculum/` and listing its id on that semester. `src/lib/py/grade.test.ts` runs every published solution against its own tests.

## Run

Node.js 22.

```bash
npm install
npm test
npm run dev
```

Dev server listens on port 8080. Typecheck is `npm run typecheck`. Production build is `npm run build`.

## Security in this snapshot

- Student code is not executed on the application server
- No outside service receives source or study notes
- Browser storage is visible to anyone on that profile
- A future account system must hash passwords, separate users, rate-limit, and stop SQL injection in the query layer rather than by string-building SQL
