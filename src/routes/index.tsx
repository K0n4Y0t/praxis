import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LESSONS } from "@/lib/curriculum/lessons";
import { SEMESTERS } from "@/lib/curriculum/semesters";
import { PLAN_BLOCKS, bangkokDate, streakEndingToday } from "@/lib/progress/dates";
import { continuation, isLessonComplete, semesterAssessment, weakLessons } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const data = useProgress();
  const current = continuation(data);
  const semester = SEMESTERS.find((item) => item.id === current.semester) ?? SEMESTERS[0];
  const done = LESSONS.filter((lesson) => isLessonComplete(lesson, data)).length;
  const day = bangkokDate();
  const seconds = data.secondsByDay[day] ?? 0;
  const minutes = Math.floor(seconds / 60);
  const streak = streakEndingToday(data.secondsByDay);
  const weak = weakLessons(data);
  const plan = data.planByDay[day] ?? [];
  const assessment = semesterAssessment(current.semester, data);

  return (
    <div className="grid gap-8">
      <header className="grid max-w-2xl gap-3">
        <Eyebrow>สำนักเรียนด้วยการลงมือทำ</Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">วันนี้เรียนต่อจากของที่ยังไม่ผ่าน</h1>
        <p className="text-muted">
          สิบสองภาค จากคนที่ยังไม่เขียนโปรแกรม ไปจนถึงคนที่ออกแบบระบบเองได้ อธิบายเป็นไทย คำเทคนิคคงภาษาอังกฤษ
        </p>
      </header>

      <Panel className="grid gap-6 overflow-hidden md:grid-cols-[1.4fr_0.9fr] md:items-center md:p-7">
        <div className="grid gap-2">
          <p className="text-sm text-muted">บทถัดไป · ภาค {semester.id}</p>
          <h2 className="text-2xl font-semibold tracking-tight">{current.title}</h2>
          <p className="text-sm text-accent">{current.en}</p>
          <p className="text-sm text-muted">ประมาณ {current.minutes} นาที ต้องผ่านคำถามกับแล็บ ไม่ใช่แค่เลื่อนจบ</p>
          <Link
            to="/learn/$lessonId"
            params={{ lessonId: current.id }}
            className="mt-3 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
          >
            เข้าบทเรียน <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="บทที่ผ่านแล้ว" value={`${done}/${LESSONS.length}`} />
          <Stat label="วันนี้" value={`${minutes} นาที`} />
          <Stat label="ต่อเนื่อง" value={`${streak} วัน`} />
          <Stat label={`ภาค ${current.semester}`} value={assessment.total === null ? "ยังไม่คิด" : `${assessment.total}/100`} />
        </dl>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-semibold">ตารางสองชั่วโมงวันนี้</h2>
          <ul className="grid gap-2 text-sm">
            {PLAN_BLOCKS.map((block) => (
              <li key={block.id} className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-b-0">
                <span>{plan.includes(block.id) ? "ทำแล้ว" : "ยัง"} · {block.label}</span>
                <span className="text-muted tabular-nums">{block.minutes} นาที</span>
              </li>
            ))}
          </ul>
          <Link to="/planner" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-accent">
            เปิดตารางและทบทวนสัปดาห์
          </Link>
        </Panel>
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg/35 p-3">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
