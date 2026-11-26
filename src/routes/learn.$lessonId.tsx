import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, ChevronLeft, ChevronRight, Play, RotateCcw } from "lucide-react";
import { getLesson, getSemester, lessonsInSemester, nextLesson, prevLesson } from "@/lib/curriculum/index";
import { isLessonComplete, lessonMastery } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { CheckList } from "@/components/checks";
import { CodeEditor } from "@/components/editor";
import { Runner } from "@/components/runner";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { runPython } from "@/lib/py/run";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/learn/$lessonId")({ component: LessonPage });

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lesson = getLesson(lessonId);
  const data = useProgress();
  const markDone = useProgress((state) => state.markDone);
  const [cause, setCause] = useState("");
  useEffect(() => {
    setCause("");
  }, [lessonId]);
  const done = lesson ? isLessonComplete(lesson, data) : false;
  useEffect(() => {
    if (lesson && done) markDone(lesson.id);
  }, [done, lesson, markDone]);
  if (!lesson) return <p>ไม่พบบทเรียนนี้</p>;
  const semester = getSemester(lesson.semester);
  const missing = lesson.prereq.map((id) => getLesson(id)).filter((item) => item && !isLessonComplete(item, data));
  const mastery = lessonMastery(lesson, data);
  const labState = lesson.lab ? data.labs[lesson.lab.id] : undefined;
  const siblings = lessonsInSemester(lesson.semester);
  const following = nextLesson(lesson.id);
  const previous = prevLesson(lesson.id);

  return (
    <article className="grid gap-8">
      <header className="grid gap-2">
        <Eyebrow>
          <Link to="/curriculum/$semesterId" params={{ semesterId: String(lesson.semester) }}>
            ภาค {lesson.semester}
            {semester ? ` · ${semester.title}` : ""}
          </Link>
        </Eyebrow>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{lesson.title}</h1>
          <button
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-full border",
              data.bookmarks.includes(lesson.id) ? "border-accent bg-accent-soft text-accent" : "border-line text-muted",
            )}
            aria-label={data.bookmarks.includes(lesson.id) ? "เอาที่คั่นออก" : "คั่นบทนี้"}
            onClick={() => data.toggleBookmark(lesson.id)}
          >
            <Bookmark className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-accent">{lesson.en}</p>
        <p className="text-sm text-muted">
          {done ? `ผ่านแล้ว · ความเชี่ยวชาญ ${mastery} จาก 100` : "ยังไม่ผ่านเกณฑ์จบบท"} · ประมาณ {lesson.minutes} นาที
        </p>
      </header>

      <Pager previous={previous} following={following} />

      <nav aria-label="บทในภาคนี้" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {siblings.map((item) => (
          <Link
            key={item.id}
            to="/learn/$lessonId"
            params={{ lessonId: item.id }}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-sm",
              item.id === lesson.id ? "bg-accent font-semibold text-accent-fg" : "bg-surface-2 text-muted md:bg-bg/40",
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      {missing.length ? (
        <Panel>
          <h2 className="font-semibold">ความรู้ก่อนหน้ายังไม่ผ่าน</h2>
          <p className="mt-2 text-sm">อ่านบทนี้ได้ แต่จะยังไม่นับว่าจบจนกว่าบทก่อนจะผ่านเกณฑ์</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {missing.map((item) =>
              item ? (
                <li key={item.id}>
                  <Link className="font-semibold text-accent" to="/learn/$lessonId" params={{ lessonId: item.id }}>
                    {item.title}
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </Panel>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">เป้าหมาย</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Panel>
            <h3 className="text-sm font-semibold text-muted">จะได้อะไร</h3>
            <ul className="mt-2 grid list-disc gap-2 pl-4 text-sm">{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
          </Panel>
          <Panel>
            <h3 className="text-sm font-semibold text-muted">ต้องมีมาก่อน</h3>
            <ul className="mt-2 grid list-disc gap-2 pl-4 text-sm">{lesson.prior.map((item) => <li key={item}>{item}</li>)}</ul>
          </Panel>
          <Panel>
            <h3 className="text-sm font-semibold text-muted">ทำได้เมื่อจบ</h3>
            <ul className="mt-2 grid list-disc gap-2 pl-4 text-sm">{lesson.canDo.map((item) => <li key={item}>{item}</li>)}</ul>
          </Panel>
        </div>
      </section>

      <section className="grid max-w-3xl gap-8">
        <h2 className="text-xl font-semibold tracking-tight">แนวคิด</h2>
        {lesson.concept.map((block) => (
          <div key={block.heading} className="grid gap-3">
            <h3 className="text-lg font-semibold tracking-tight">{block.heading}</h3>
            {block.body.map((paragraph) => (
              <p key={paragraph} className="text-[17px] leading-8">{paragraph}</p>
            ))}
          </div>
        ))}
      </section>

      {lesson.example ? <TryIt key={lesson.id} code={lesson.example.code} note={lesson.example.note} /> : null}

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">ตรวจความเข้าใจ</h2>
        <p className="text-sm text-muted">คำอธิบายจะเปิดเมื่อตอบถูก หรือเมื่อผิดครบสามครั้ง</p>
        <CheckList checks={lesson.checks} attempts={data.checks} onAnswer={(id, correct) => data.answerCheck(id, correct)} />
      </section>

      {lesson.lab ? (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold tracking-tight">แล็บ</h2>
          <p className="max-w-3xl leading-7">{lesson.lab.prompt}</p>
          <p className="text-sm text-muted">
            ตัวรันเป็น Python ชุดย่อยในเบราว์เซอร์ มีเพดานจำนวนขั้น และไม่เปิดไฟล์หรือ import ไม่ใช่เครื่องเซิร์ฟเวอร์
          </p>
          <Runner
            key={lesson.lab.id}
            initial={lesson.lab.starter}
            tests={lesson.lab.tests}
            hints={lesson.lab.hints}
            solution={lesson.lab.solution}
            solutionWhy={lesson.lab.solutionWhy}
            hintLevel={labState?.hintLevel ?? 0}
            solutionSeen={labState?.solutionSeen ?? false}
            onHint={(level) => data.openHint(lesson.lab!.id, "labs", level)}
            onReveal={() => data.revealSolution(lesson.lab!.id, "labs")}
            onGraded={(passed) => data.recordRun(lesson.lab!.id, "labs", passed)}
          />
          <Panel className="grid gap-3">
            <h3 className="font-semibold">จดลงสมุดความผิดพลาด</h3>
            <textarea
              value={cause}
              onChange={(event) => setCause(event.target.value)}
              rows={3}
              placeholder="อะไรพลาด สาเหตุ และจะตรวจอย่างไรครั้งหน้า"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (!cause.trim()) return;
                data.addMistake({
                  title: lesson.title,
                  error: labState?.passed ? "ผ่านแล้ว แต่อยากจำจุดที่สงสัย" : "แล็บยังไม่ผ่านหรือพึ่งผ่าน",
                  cause,
                  fix: "ดูในโค้ดที่แก้รอบล่าสุด",
                  learned: cause,
                });
                setCause("");
              }}
            >
              บันทึก
            </Button>
          </Panel>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">สรุป</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm">{lesson.summary.map((item) => <li key={item}>{item}</li>)}</ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">คำศัพท์</h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-2 pr-3 font-semibold">คำ</th>
                <th className="py-2 font-semibold">ความหมาย</th>
              </tr>
            </thead>
            <tbody>
              {lesson.vocab.map((item) => (
                <tr key={item.term} className="border-b border-line align-top last:border-0">
                  <td className="py-2 pr-3 font-semibold">{item.term}</td>
                  <td className="py-2">{item.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel className="bg-signal/8">
          <h2 className="font-semibold">พลาดบ่อย</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm">{lesson.pitfalls.map((item) => <li key={item}>{item}</li>)}</ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">คำถามทบทวน</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm">{lesson.review.map((item) => <li key={item}>{item}</li>)}</ul>
        </Panel>
      </section>

      <Pager previous={previous} following={following} />
    </article>
  );
}

function Pager({ previous, following }: { previous?: { id: string; title: string }; following?: { id: string; title: string } }) {
  return (
    <nav className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {previous ? (
        <Link to="/learn/$lessonId" params={{ lessonId: previous.id }} className="inline-flex min-h-11 items-center gap-1 rounded-full px-1 text-sm text-muted">
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="truncate">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {following ? (
        <Link to="/learn/$lessonId" params={{ lessonId: following.id }} className="inline-flex min-h-11 items-center justify-end gap-1 rounded-full bg-accent-soft px-4 text-sm font-semibold text-fg">
          <span className="truncate">{following.title}</span>
          <ChevronRight className="size-4 text-accent" aria-hidden="true" />
        </Link>
      ) : (
        <span className="text-sm text-muted">จบเส้นบทเรียนแล้ว</span>
      )}
    </nav>
  );
}

function TryIt({ code, note }: { code: string; note: string }) {
  const [draft, setDraft] = useState(code);
  const [output, setOutput] = useState("");

  function run() {
    const result = runPython(draft);
    setOutput(result.error ? `${result.error.name}: ${result.error.message}` : result.stdout || "(ไม่มีข้อความออก)");
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">ลองเอง</h2>
        <p className="text-xs text-muted">แก้โค้ดแล้วรันได้ทันที</p>
      </div>
      <div className="overflow-hidden rounded-3xl bg-surface shadow-[0_16px_40px_rgba(0,0,0,0.18)] md:bg-bg/30 md:shadow-none">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="grid gap-3 border-b border-line p-3 lg:border-r lg:border-b-0">
            <CodeEditor value={draft} onChange={setDraft} label="โค้ดตัวอย่าง แก้แล้วรันได้" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={run}>
                <Play className="size-4" aria-hidden="true" />
                รัน
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setDraft(code); setOutput(""); }}>
                <RotateCcw className="size-4" aria-hidden="true" />
                คืนโค้ดเดิม
              </Button>
            </div>
          </div>
          <div className="grid min-h-48 content-start gap-2 bg-bg/40 p-5">
            <p className="text-xs font-medium text-muted">ผลลัพธ์</p>
            <pre className="overflow-auto font-mono text-sm leading-6 whitespace-pre-wrap">
              {output || "กดรัน ผลจะอยู่ฝั่งนี้"}
            </pre>
          </div>
        </div>
      </div>
      <p className="text-sm leading-7 text-muted">{note}</p>
    </section>
  );
}
