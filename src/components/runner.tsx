import { useMemo, useState } from "react";
import { Lightbulb, Play, RotateCcw } from "lucide-react";
import type { LabTest } from "@/lib/curriculum/types";
import { explainError, runPython } from "@/lib/py/run";
import { gradeCode, type GradedTest } from "@/lib/py/grade";
import { Button, Panel } from "./ui";
import { CodeEditor } from "./editor";

export function Runner({
  initial,
  tests,
  hints,
  solution,
  solutionWhy,
  hintLevel,
  solutionSeen,
  onHint,
  onReveal,
  onGraded,
}: {
  initial: string;
  tests?: LabTest[];
  hints: string[];
  solution: string;
  solutionWhy: string;
  hintLevel: number;
  solutionSeen: boolean;
  onHint: (level: number) => void;
  onReveal: () => void;
  onGraded?: (passed: boolean) => void;
}) {
  const [code, setCode] = useState(initial);
  const [stdin, setStdin] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [free, setFree] = useState<ReturnType<typeof runPython> | null>(null);
  const [graded, setGraded] = useState<GradedTest[] | null>(null);

  const shownHints = hints.slice(0, hintLevel);

  const errorInfo = useMemo(() => (free?.error ? explainError(free.error.name) : null), [free]);

  function runFree() {
    const result = runPython(code, stdin);
    setFree(result);
    setGraded(null);
  }

  function runTests() {
    if (!tests?.length) return;
    const result = gradeCode(code, tests);
    setGraded(result);
    setFree(null);
    onGraded?.(result.every((item) => item.pass));
  }

  function reset() {
    if (code !== initial && !window.confirm("ทิ้งโค้ดที่แก้ไว้ แล้วกลับไปจุดเริ่ม?")) return;
    setCode(initial);
    setFree(null);
    setGraded(null);
    setResetKey((n) => n + 1);
  }

  const status = graded
    ? graded.every((item) => item.pass)
      ? "ผ่าน"
      : "ไม่ผ่าน"
    : free?.error?.name === "TimeoutError"
      ? "เกินเพดานขั้น"
      : free?.error
        ? "ผิดพลาด"
        : free
          ? "รันแล้ว"
          : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
      <div className="grid min-w-0 gap-4">
        <CodeEditor key={resetKey} value={code} onChange={setCode} />
        <label className="grid gap-2 text-sm">
          <span className="text-muted">อินพุตสำหรับรันทดลอง หนึ่งบรรทัดต่อหนึ่ง input — ตัวตรวจใช้อินพุตของโจทย์เอง</span>
          <textarea
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm text-fg"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={runFree}>
            <Play className="size-4" aria-hidden="true" />
            รัน
          </Button>
          {tests?.length ? (
            <Button type="button" variant="ghost" onClick={runTests}>
              ตรวจด้วยเทสต์
            </Button>
          ) : null}
          <Button type="button" variant="quiet" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            เริ่มใหม่
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-4">
      {status ? <p className="text-sm font-semibold">สถานะ: {status}</p> : <p className="text-sm text-muted">ยังไม่รัน</p>}

      {free ? (
        <Panel className="grid gap-3">
          <h3 className="text-base font-semibold">ผลการรัน</h3>
          {free.error ? (
            <div className="grid gap-2 text-sm">
              <p className="font-semibold">
                {free.error.name}
                {free.error.line ? ` · บรรทัด ${free.error.line}` : ""}
              </p>
              <p>{free.error.message}</p>
              {errorInfo ? (
                <>
                  <p>{errorInfo.meaning}</p>
                  <p className="text-muted">สาเหตุที่เป็นไปได้: {errorInfo.causes.join(" · ")}</p>
                  <p className="text-muted">วิธีตรวจ: {errorInfo.checks.join(" · ")}</p>
                </>
              ) : null}
              {free.stdout ? <pre className="overflow-x-auto font-mono text-sm whitespace-pre">{free.stdout}</pre> : null}
            </div>
          ) : (
            <pre className="overflow-x-auto font-mono text-sm whitespace-pre">{free.stdout || "(ไม่มีข้อความออก)"}</pre>
          )}
          {free.variables.length ? (
            <div>
              <p className="mb-2 text-sm text-muted">ชื่อที่เหลืออยู่หลังรัน</p>
              <ul className="grid gap-1 font-mono text-sm">
                {free.variables.map((variable) => (
                  <li key={variable.name}>
                    {variable.name} = {variable.value}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {graded ? (
        <Panel className="grid gap-3">
          <h3 className="text-base font-semibold">{graded.every((item) => item.pass) ? "ผ่านทุกเทสต์ที่กำหนด" : "ไม่ผ่านบางเทสต์"}</h3>
          <ul className="grid gap-3">
            {graded.map((item) => (
              <li key={item.name} className="border-t border-line pt-3 text-sm first:border-t-0 first:pt-0">
                <p className="font-semibold">
                  {item.pass ? "ผ่าน" : "ไม่ผ่าน"} · {item.name}
                </p>
                {item.error ? (
                  <p className="mt-1">
                    {item.error.name}: {item.error.message}
                  </p>
                ) : (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-muted">ที่คาด</p>
                      <pre className="font-mono whitespace-pre-wrap">{item.expected || "(ว่าง)"}</pre>
                    </div>
                    <div>
                      <p className="text-muted">ที่ได้</p>
                      <pre className="font-mono whitespace-pre-wrap">{item.actual || "(ว่าง)"}</pre>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel className="grid gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Lightbulb className="size-4 text-accent" aria-hidden="true" />
          คำใบ้ ไม่ใช่คำตอบ
        </h3>
        <div className="flex flex-wrap gap-2">
          {hints.map((_, index) => (
            <Button key={index} type="button" variant="ghost" onClick={() => onHint(index + 1)} disabled={hintLevel >= index + 1}>
              ระดับ {index + 1}
            </Button>
          ))}
          <Button type="button" variant="ghost" onClick={onReveal}>
            ระดับ 5 เฉลยเต็ม
          </Button>
        </div>
        {shownHints.length ? (
          <ol className="grid list-decimal gap-2 pl-5 text-sm">
            {shownHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">ยังไม่เปิดคำใบ้ ลองรันและอ่านผลก่อน</p>
        )}
        {solutionSeen ? (
          <div className="grid gap-2 border-t border-line pt-3 text-sm">
            <p className="font-semibold">เฉลยและเหตุผล — ความเชี่ยวชาญของข้อนี้จะถูกจำกัดไว้</p>
            <pre className="overflow-x-auto rounded-lg bg-bg p-3 font-mono whitespace-pre">{solution}</pre>
            <p>{solutionWhy}</p>
          </div>
        ) : null}
      </Panel>
      </div>
    </div>
  );
}
