import { createFileRoute, Link } from "@tanstack/react-router";
import { PLAN_BLOCKS, bangkokDate, streakEndingToday } from "@/lib/progress/dates";
import { continuation } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/planner")({ component: Planner });

function Planner() {
  const data = useProgress();
  const day = bangkokDate();
  const done = data.planByDay[day] ?? [];
  const minutes = Math.floor((data.secondsByDay[day] ?? 0) / 60);
  const current = continuation(data);
  const days = Object.keys(data.secondsByDay).sort().slice(-7);

  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <Eyebrow>{day}</Eyebrow>
        <h1 className="text-4xl font-semibold">สองชั่วโมงของวันนี้</h1>
        <p className="text-muted">บันทึกบนเครื่องนี้ {minutes} นาทีในหน้าเรียน สนามทดลอง โจทย์ และโครงงาน · ต่อเนื่อง {streakEndingToday(data.secondsByDay)} วัน</p>
      </header>
      <div className="grid gap-3">
        {PLAN_BLOCKS.map((block) => (
          <Panel key={block.id} className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{block.label} · {block.minutes} นาที</h2>
              <p className="mt-1 text-sm text-muted">{block.detail}</p>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={done.includes(block.id)} onChange={() => data.togglePlan(block.id)} />
              ทำแล้ว
            </label>
          </Panel>
        ))}
      </div>
      <Panel>
        <h2 className="font-semibold">งานที่ควรเปิด</h2>
        <p className="mt-2 text-sm">{current.title}</p>
        <Link to="/learn/$lessonId" params={{ lessonId: current.id }} className="mt-2 inline-flex min-h-11 items-center font-semibold text-accent">
          ไปที่บทนี้
        </Link>
      </Panel>
      <Panel>
        <h2 className="font-semibold">เจ็ดวันล่าสุดที่มีบันทึกเวลา</h2>
        {days.length === 0 ? <p className="mt-2 text-sm text-muted">ยังไม่มี เปิดบทเรียนค้างไว้สักครู่</p> : null}
        <ul className="mt-3 grid gap-2 text-sm">
          {days.map((item) => (
            <li key={item} className="flex justify-between tabular-nums">
              <span>{item}</span>
              <span>{Math.floor((data.secondsByDay[item] ?? 0) / 60)} นาที</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
