import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { examForSemester } from "@/lib/curriculum/exam";
import { SEMESTERS } from "@/lib/curriculum/semesters";
import { semesterAssessment, trackProgress } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { CheckList } from "@/components/checks";
import { Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
  const data = useProgress();
  const tracks = trackProgress(data);
  const [semesterId, setSemesterId] = useState(1);
  const assessment = semesterAssessment(semesterId, data);
  const exam = examForSemester(semesterId);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Eyebrow>ไม่นับจากปุ่มจบ</Eyebrow>
        <h1 className="text-4xl font-semibold">ความเชี่ยวชาญ</h1>
        <p className="max-w-2xl text-muted">
          คะแนนมาจากคำถาม แล็บที่ผ่าน โจทย์ดีบักที่ไม่ได้เปิดเฉลย และหลักไมล์โครงงานที่คุณติ๊กเอง ส่วนที่ยังไม่เริ่มไม่ถูกตีเป็นศูนย์
        </p>
      </header>
      <label className="grid max-w-xs gap-2 text-sm">
        เลือกภาค
        <select
          value={semesterId}
          onChange={(event) => setSemesterId(Number(event.target.value))}
          className="min-h-11 rounded-full border border-line bg-surface-2 px-4"
        >
          {SEMESTERS.map((semester) => (
            <option key={semester.id} value={semester.id}>
              ภาค {semester.id} · {semester.title}
            </option>
          ))}
        </select>
      </label>
      <Panel>
        <h2 className="font-semibold">ภาค {semesterId} ตามสัดส่วนหลักสูตร</h2>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{assessment.total === null ? "ยังเริ่มไม่พอที่จะคิดคะแนนรวม" : `${assessment.total} / 100`}</p>
        <p className="mt-2 text-sm text-muted">เกณฑ์ผ่านที่ตั้งไว้คือ 75 และโครงงานต้องทำของจริง ไม่ใช่แค่ข้อสอบ โครงงานยังเป็นคะแนนประเมินตนเอง</p>
        <ul className="mt-4 grid gap-3">
          {assessment.parts.map((part) => (
            <li key={part.key} className="grid gap-1 text-sm">
              <div className="flex justify-between gap-3">
                <span>{part.label} · {part.weight}%</span>
                <span className="tabular-nums">{part.score === null ? "ยังไม่เริ่ม" : part.score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg/50">
                <div className="h-full bg-accent" style={{ width: `${part.score ?? 0}%` }} />
              </div>
              <p className="text-muted">{part.note}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel>
        <h2 className="font-semibold">สายทักษะจากบทที่เปิดแล้ว</h2>
        <ul className="mt-4 grid gap-3">
          {tracks.map((track) => (
            <li key={track.id} className="grid gap-1 text-sm">
              <div className="flex justify-between">
                <span>{track.label}</span>
                <span className="tabular-nums text-muted">{track.total ? `${track.done}/${track.total}` : "รอเนื้อหา"} {track.mastery !== null ? `· ${track.mastery}` : ""}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg/50">
                <div className="h-full bg-ok" style={{ width: track.total ? `${(track.done / track.total) * 100}%` : "0%" }} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">ข้อสอบทฤษฎีภาค {semesterId}</h2>
        <p className="text-sm text-muted">ทำเมื่อพร้อม คำอธิบายไม่โผล่ทันที</p>
        <CheckList checks={exam} attempts={data.exam} onAnswer={(id, correct) => data.answerCheck(id, correct, "exam")} />
      </section>
      <Link to="/curriculum" className="text-sm font-semibold text-accent">กลับหลักสูตร</Link>
    </div>
  );
}