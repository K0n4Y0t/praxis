import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LESSONS } from "@/lib/curriculum/lessons";
import { SEMESTERS } from "@/lib/curriculum/semesters";
import { PLAN_BLOCKS, bangkokDate, mondayOf, secondsInDays, streakEndingToday, weekDays } from "@/lib/progress/dates";
import { continuation, isLessonComplete, semesterAssessment, weakLessons } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { Panel } from "@/components/ui";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const data = useProgress();
  const current = continuation(data);
  const semester = SEMESTERS.find((item) => item.id === current.semester) ?? SEMESTERS[0];
  const done = LESSONS.filter((lesson) => isLessonComplete(lesson, data)).length;
  const day = bangkokDate();
  const seconds = data.secondsByDay[day] ?? 0;
  const minutes = Math.floor(seconds / 60);
  const weekMinutes = Math.floor(secondsInDays(data.secondsByDay, weekDays(mondayOf(day))) / 60);
  const streak = streakEndingToday(data.secondsByDay);
  const weak = weakLessons(data);
  const plan = data.planByDay[day] ?? [];
  const assessment = semesterAssessment(current.semester, data);

  return (
    <div className="grid gap-8">
      <section className="grid max-w-[70ch] gap-3">
        <p className="text-sm text-muted">บทถัดไป · ภาค {semester.id} · ประมาณ {current.minutes} นาที</p>
        <h1 className="text-3xl font-semibold tracking-tight">{current.title}</h1>
        <p className="text-accent">{current.en}</p>
        <p>ต้องผ่านคำถามกับแล็บ ไม่ใช่แค่เลื่อนจบ วันนี้เรียนไป {minutes} จาก 120 นาที</p>
        <Link
          to="/learn/$lessonId"
          params={{ lessonId: current.id }}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg"
        >
          เข้าบทเรียน <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <Panel>
        <h2 className="font-semibold">ตารางสองชั่วโมงวันนี้</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {PLAN_BLOCKS.map((block) => (
            <li key={block.id} className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-b-0">
              <span>{plan.includes(block.id) ? "ทำแล้ว" : "ยัง"} · {block.label}</span>
              <span className="text-muted tabular-nums">{block.minutes} นาที</span>
            </li>
          ))}
        </ul>
        <Link to="/planner" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent">
          เปิดตารางวัน
        </Link>
      </Panel>

      <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <Stat label="บทที่ผ่านแล้ว" value={`${done}/${LESSONS.length}`} />
        <Stat label="ต่อเนื่อง" value={`${streak} วัน`} />
        <Stat label="สัปดาห์นี้" value={`${weekMinutes}/840 นาที`} />
        <Stat label={`ภาค ${current.semester}`} value={assessment.total === null ? "ยังไม่เริ่ม" : `${assessment.total}/100`} />
      </dl>
      <Panel>
        <h2 className="mb-3 font-semibold">จุดที่ควรกลับไป</h2>
        {weak.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีบทที่พลาดซ้ำ เริ่มบทแรกได้เลย</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {weak.slice(0, 4).map((lesson) => (
              <li key={lesson.id}>
                <Link to="/learn/$lessonId" params={{ lessonId: lesson.id }} className="font-semibold">
                  {lesson.title}
                </Link>
                <p className="text-muted">มีร่องรอยว่าทำแล็บหรือคำถามไม่ผ่าน</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
