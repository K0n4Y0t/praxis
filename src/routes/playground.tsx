import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play, RotateCcw } from "lucide-react";
import { explainError, runPython } from "@/lib/py/run";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { CodeEditor } from "@/components/editor";

const STARTER = 'name = "Praxis"\nprint("สวัสดี", name)\nfor n in range(3):\n    print(n)\n';

export const Route = createFileRoute("/playground")({ component: Playground });

function Playground() {
  const [code, setCode] = useState(STARTER);
  const [stdin, setStdin] = useState("");
  const [key, setKey] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof runPython> | null>(null);
  const info = result?.error ? explainError(result.error.name) : null;

  function reset() {
    if (code !== STARTER && !window.confirm("ทิ้งโค้ดที่แก้ไว้ แล้วกลับไปจุดเริ่ม?")) return;
    setCode(STARTER);
    setResult(null);
    setKey((n) => n + 1);
  }

  const status = !result ? "ยังไม่รัน" : result.error?.name === "TimeoutError" ? "เกินเพดานขั้น" : result.error ? "ผิดพลาด" : "รันแล้ว";

  return (
    <div className="grid gap-5">
      <header className="grid max-w-[70ch] gap-2">
        <Eyebrow>ไม่มีเฉลย เพราะไม่มีโจทย์</Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight">สนามทดลอง</h1>
        <p className="text-muted">
          รองรับตัวแปร เงื่อนไข ลูป ฟังก์ชัน ลิสต์ dict และฟังก์ชันพื้นฐานอย่าง print, input, range, len ไม่มี import ไม่มีไฟล์ และลูปไม่จบจะถูกตัด
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <div className="grid min-w-0 gap-3">
          <CodeEditor key={key} value={code} onChange={setCode} />
          <textarea
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
            rows={2}
            aria-label="อินพุต"
            placeholder="อินพุต ถ้าโปรแกรมเรียก input()"
            className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setResult(runPython(code, stdin))}>
              <Play className="size-4" aria-hidden="true" /> รัน
            </Button>
            <Button type="button" variant="quiet" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden="true" /> รีเซ็ต
            </Button>
          </div>
        </div>
        <Panel className="grid min-w-0 content-start gap-2">
          <p className="text-sm font-semibold">สถานะ: {status}</p>
          {result?.error ? (
            <div className="grid gap-2 text-sm">
              <p className="font-semibold">
                {result.error.name}
                {result.error.line ? ` · บรรทัด ${result.error.line}` : ""}
              </p>
              <p>{result.error.message}</p>
              {info ? <p>{info.meaning}</p> : null}
              {info ? <p className="text-muted">ตรวจ: {info.checks.join(" · ")}</p> : null}
            </div>
          ) : (
            <pre className="overflow-x-auto font-mono text-sm whitespace-pre">{result?.stdout || "กดรัน ผลจะอยู่ฝั่งนี้"}</pre>
          )}
        </Panel>
      </div>
    </div>
  );
}
