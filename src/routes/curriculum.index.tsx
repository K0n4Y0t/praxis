import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lessonsInSemester, SEMESTERS } from "@/lib/curriculum/index";
import { isLessonComplete } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/curriculum/")({ component: Curriculum });

function Curriculum() {
  const data = useProgress();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const semesters = SEMESTERS.filter((semester) => {
    if (!needle) return true;
    const lessons = lessonsInSemester(semester.id);
    const blob = `${semester.title} ${semester.en} ${lessons.map((lesson) => `${lesson.title} ${lesson.en}`).join(" ")}`.toLowerCase();
    return blob.includes(needle);
  });

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Eyebrow>12 ภาค · 36–48 เดือน</Eyebrow>
        <h1 className="text-4xl font-semibold">หลักสูตร</h1>
        <p className="max-w-2xl text-muted">
          สิบสองภาคเปิดเรียนได้แล้ว แต่ละบทมีแนวคิด ตัวอย่างที่แก้ได้ คำถาม และแล็บที่ตัวตรวจรันให้ ภาคหลัง ๆ เป็นแบบจำลองด้วย Python ชุดย่อยในเบราว์เซอร์ ไม่ใช่การรันลินุกซ์ ภาษาซี หรือฐานข้อมูลจริง
        </p>
      </header>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ค้นหาชื่อวิชา"
        aria-label="ค้นหาหลักสูตร"
        className="min-h-11 rounded-md border border-line bg-surface px-3"
      />
      <div className="grid gap-4">
        {semesters.map((semester) => {
          const lessons = lessonsInSemester(semester.id);
          const done = lessons.filter((lesson) => isLessonComplete(lesson, data)).length;
          return (
            <Panel key={semester.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold">
                  ภาค {semester.id} · {semester.title}
                </h2>
                <p className="text-sm text-muted">{semester.span}</p>
              </div>
              <p className="mt-1 text-sm text-accent">{semester.en}</p>
              <p className="mt-3 text-sm">{semester.summary}</p>
              <p className="mt-3 text-sm text-muted tabular-nums">
                {lessons.length ? `บทที่ตรวจได้ ${done}/${lessons.length}` : `หัวข้อในแผน ${semester.planned.length} เรื่อง · ยังไม่มีแล็บรายบท`}
              </p>
              <Link to="/curriculum/$semesterId" params={{ semesterId: String(semester.id) }} className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent">
                เปิดภาควิชา
              </Link>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
