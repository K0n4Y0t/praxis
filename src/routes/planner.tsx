import { createFileRoute, Link } from "@tanstack/react-router";
import { LESSON_MAP } from "@/lib/curriculum/lessons";
import { CHALLENGES } from "@/lib/curriculum/challenges";
import { bangkokDate, mondayOf, secondsInDays, streakEndingToday, weekDays, addDays, PLAN_BLOCKS } from "@/lib/progress/dates";
import { continuation, weakLessons } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/planner")({ component: Planner });

const WEEK_TARGET = 14 * 60;

function Planner() {
  const data = useProgress();
  const day = bangkokDate();
  const done = data.planByDay[day] ?? [];
  const minutes = Math.floor((data.secondsByDay[day] ?? 0) / 60);
  const current = continuation(data);
  const start = mondayOf(day);
  const days = weekDays(start);
  const weekMinutes = Math.floor(secondsInDays(data.secondsByDay, days) / 60);
  const lastMinutes = Math.floor(secondsInDays(data.secondsByDay, weekDays(addDays(start, -7))) / 60);
  const finished = Object.entries(data.doneOn ?? {})
    .filter(([, on]) => days.includes(on))
    .map(([id]) => LESSON_MAP.get(id))
    .filter((lesson) => !!lesson);
  const weak = weakLessons(data).slice(0, 3);
  const practice = CHALLENGES.find((item) => item.semester === current.semester);
  const width = Math.min(100, Math.round((weekMinutes / WEEK_TARGET) * 100));

  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <Eyebrow>{day}</Eyebrow>
        <h1 className="text-4xl font-semibold">สองชั่วโมงของวันนี้</h1>
        <p className="text-muted">บันทึกบนเครื่องนี้ {minutes} นาทีในหน้าเรียน สนามทดลอง โจทย์ และโครงงาน · ต่อเนื่อง {streakEndingToday(data.secondsByDay)} วัน</p>
      </header>
      <Panel className="grid gap-3">
        <h2 className="font-semibold">ทบทวนสัปดาห์นี้</h2>
        <p className="text-sm text-muted">{days[0]} ถึง {days[6]} · เป้า 14 ชั่วโมง จากวันละ 2 ชั่วโมง</p>
        <p className="text-3xl font-semibold tabular-nums">{weekMinutes} <span className="text-base font-normal text-muted">/ {WEEK_TARGET} นาที</span></p>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-accent" style={{ width: `${width}%` }} />
        </div>
        <p className="text-sm text-muted">สัปดาห์ก่อนหน้า {lastMinutes} นาที วันที่จบบทเริ่มถูกจำจากวันนี้เป็นต้นไป บทที่ผ่านก่อนหน้านี้ไม่มีวันที่</p>
        <div>
          <h3 className="text-sm font-semibold">บทที่จบในสัปดาห์นี้</h3>
          {finished.length === 0 ? <p className="mt-1 text-sm text-muted">ยังไม่มีบทที่เพิ่งครบเกณฑ์ในสัปดาห์นี้</p> : null}
          <ul className="mt-2 grid gap-1 text-sm">
            {finished.map((lesson) => (
              <li key={lesson.id}>
                <Link to="/learn/$lessonId" params={{ lessonId: lesson.id }} className="font-semibold">
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">ควรกลับไปก่อนเปิดบทใหม่</h3>
          {weak.length === 0 ? <p className="mt-1 text-sm text-muted">ไม่มีบทที่พลาดซ้ำค้างอยู่</p> : null}
          <ul className="mt-2 grid gap-1 text-sm">
            {weak.map((lesson) => (
              <li key={lesson.id}>
                <Link to="/learn/$lessonId" params={{ lessonId: lesson.id }} className="font-semibold text-accent">
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {practice ? (
          <Link to="/practice/$challengeId" params={{ challengeId: practice.id }} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent">
            โจทย์ฝึกของภาค {current.semester} · {practice.title}
          </Link>
        ) : null}
      </Panel>
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
        <h2 className="font-semibold">เวลาแต่ละวันในสัปดาห์นี้</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {days.map((item) => (
            <li key={item} className="flex justify-between tabular-nums">
              <span>{item}{item === day ? " · วันนี้" : ""}</span>
              <span>{Math.floor((data.secondsByDay[item] ?? 0) / 60)} นาที</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}