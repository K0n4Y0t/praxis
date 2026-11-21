import { createFileRoute, Link } from "@tanstack/react-router";
import { getSemester, lessonsInSemester, PROJECT_MAP } from "@/lib/curriculum/index";
import { isLessonComplete, lessonMastery } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/curriculum/$semesterId")({ component: SemesterPage });

function SemesterPage() {
  const { semesterId } = Route.useParams();
  const semester = getSemester(Number(semesterId));
  const data = useProgress();
  if (!semester) return <p>ไม่พบภาคนี้</p>;
  const lessons = lessonsInSemester(semester.id);
  const project = PROJECT_MAP.get(semester.projectId);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Eyebrow>ภาค {semester.id} · {semester.span}</Eyebrow>
        <h1 className="text-4xl font-semibold">{semester.title}</h1>
        <p className="text-accent">{semester.en}</p>
        <p className="max-w-2xl text-muted">{semester.summary}</p>
      </header>
      <Panel>
        <h2 className="font-semibold">ทำได้เมื่อจบภาค</h2>
        <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm">
          {semester.outcomes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
      {lessons.length ? (
        <div className="grid gap-3">
          <h2 className="text-xl font-semibold">บทเรียน</h2>
          {lessons.map((lesson, index) => {
            const done = isLessonComplete(lesson, data);
            const mastery = lessonMastery(lesson, data);
            return (
              <Link key={lesson.id} to="/learn/$lessonId" params={{ lessonId: lesson.id }} className="block">
                <Panel className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">บท {index + 1}</p>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <p className="text-sm text-muted">{lesson.en}</p>
                  </div>
                  <p className="text-sm tabular-nums text-muted">{done ? `ผ่าน · ${mastery}` : "ยัง"}</p>
                </Panel>
              </Link>
            );
          })}
        </div>
      ) : null}
      {semester.planned.length ? (
        <Panel>
          <h2 className="font-semibold">แผนบทที่ยังไม่เปิดแล็บ</h2>
          <p className="mt-2 text-sm text-muted">รายการนี้คือลำดับวิชา ไม่ใช่บทที่อ้างว่าเรียนจบได้แล้ว</p>
          <ul className="mt-4 grid gap-3">
            {semester.planned.map((topic) => (
              <li key={topic.en} className="border-t border-line pt-3 text-sm">
                <p className="font-semibold">{topic.th}</p>
                <p className="text-muted">{topic.en}</p>
                <p className="mt-1">{topic.outcome}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {project ? (
        <Panel>
          <h2 className="font-semibold">โครงงานของภาค</h2>
          <p className="mt-2">{project.title}</p>
          <Link to="/projects/$projectId" params={{ projectId: project.id }} className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent">
            เปิดโจทย์โครงงาน
          </Link>
        </Panel>
      ) : null}
    </div>
  );
}
