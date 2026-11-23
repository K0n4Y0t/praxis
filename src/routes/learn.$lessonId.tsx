import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { getLesson, getSemester, nextLesson, prevLesson } from "@/lib/curriculum/index";
import { isLessonComplete, lessonMastery } from "@/lib/progress/scoring";
import { useProgress } from "@/lib/progress/store";
import { CheckList } from "@/components/checks";
import { Runner } from "@/components/runner";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { runPython } from "@/lib/py/run";

export const Route = createFileRoute("/learn/$lessonId")({ component: LessonPage });

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lesson = getLesson(lessonId);
  const data = useProgress();
  const markDone = useProgress((state) => state.markDone);
  const [exampleOut, setExampleOut] = useState("");
  const [cause, setCause] = useState("");
  useEffect(() => {
    setExampleOut("");
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
          <h1 className="text-4xl font-semibold">{lesson.title}</h1>
          <button
            className="grid size-11 shrink-0 place-items-center rounded-md border border-line"
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
        <h2 className="text-2xl font-semibold">เป้าหมาย</h2>
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

      <section className="grid max-w-3xl gap-5">
        <h2 className="text-2xl font-semibold">แนวคิด</h2>
        {lesson.concept.map((block) => (
          <div key={block.heading} className="grid gap-2">
            <h3 className="text-lg font-semibold">{block.heading}</h3>
            {block.body.map((paragraph) => (
              <p key={paragraph} className="leading-7">{paragraph}</p>
            ))}
          </div>
        ))}
      </section>

      {lesson.example ? (
        <Example key={lesson.id} code={lesson.example.code} note={lesson.example.note} output={exampleOut} onRun={setExampleOut} />
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">ตรวจความเข้าใจ</h2>
        <p className="text-sm text-muted">คำอธิบายจะเปิดเมื่อตอบถูก หรือเมื่อผิดครบสามครั้ง</p>
        <CheckList checks={lesson.checks} attempts={data.checks} onAnswer={(id, correct) => data.answerCheck(id, correct)} />
      </section>

      {lesson.lab ? (
        <section className="grid gap-3">
          <h2 className="text-2xl font-semibold">แล็บ</h2>
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
          <ul className="mt-3 grid gap-2 text-sm">
            {lesson.vocab.map((item) => (
              <li key={item.term}>
                <span className="font-semibold">{item.term}</span> — {item.meaning}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">พลาดบ่อย</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm">{lesson.pitfalls.map((item) => <li key={item}>{item}</li>)}</ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">คำถามทบทวน</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm">{lesson.review.map((item) => <li key={item}>{item}</li>)}</ul>
        </Panel>
      </section>

      <nav className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        {previous ? (
          <Link to="/learn/$lessonId" params={{ lessonId: previous.id }} className="inline-flex min-h-11 items-center font-semibold">
            บทก่อน · {previous.title}
          </Link>
        ) : (
          <span className="text-sm text-muted">นี่คือบทแรก</span>
        )}
        {following ? (
          <Link to="/learn/$lessonId" params={{ lessonId: following.id }} className="inline-flex min-h-11 items-center font-semibold text-accent">
            บทถัดไป · {following.title}
          </Link>
        ) : (
          <span className="text-sm text-muted">จบเส้นบทเรียนแล้ว</span>
        )}
      </nav>
    </article>
  );
}

function Example({
  code,
  note,
  output,
  onRun,
}: {
  code: string;
  note: string;
  output: string;
  onRun: (value: string) => void;
}) {
  const [draft, setDraft] = useState(code);
  return (
    <section className="grid gap-3">
      <h2 className="text-2xl font-semibold">ตัวอย่างที่แก้ได้</h2>
      <p className="max-w-3xl text-sm leading-6">{note}</p>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={8}
        aria-label="โค้ดตัวอย่าง"
        className="w-full rounded-md border border-line bg-surface p-3 font-mono text-sm"
      />
      <Button
        type="button"
        onClick={() => {
          const result = runPython(draft);
          onRun(result.error ? `${result.error.name}: ${result.error.message}` : result.stdout || "(ไม่มีข้อความออก)");
        }}
      >
        รันตัวอย่าง
      </Button>
      {output ? <pre className="overflow-auto rounded-md border border-line bg-surface p-3 font-mono text-sm whitespace-pre-wrap">{output}</pre> : null}
    </section>
  );
}
