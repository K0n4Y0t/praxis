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

  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <Eyebrow>ไม่มีเฉลย เพราะไม่มีโจทย์</Eyebrow>
        <h1 className="text-4xl font-semibold">สนามทดลอง</h1>
        <p className="max-w-2xl text-muted">
          รองรับตัวแปร เงื่อนไข ลูป ฟังก์ชัน ลิสต์ dict และฟังก์ชันพื้นฐานอย่าง print, input, range, len ไม่มี import ไม่มีไฟล์ และลูปไม่จบจะถูกตัด
        </p>
      </header>
      <CodeEditor key={key} value={code} onChange={setCode} />
      <textarea
        value={stdin}
        onChange={(event) => setStdin(event.target.value)}
        rows={2}
        aria-label="อินพุต"
        placeholder="อินพุต ถ้าโปรแกรมเรียก input()"
        className="rounded-2xl border border-line bg-bg/40 px-3 py-2 font-mono text-sm"
      />
      <div className="flex gap-2">
        <Button type="button" onClick={() => setResult(runPython(code, stdin))}>
          <Play className="size-4" aria-hidden="true" /> รัน
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setCode(STARTER);
            setResult(null);
            setKey((n) => n + 1);
          }}
        >
          <RotateCcw className="size-4" aria-hidden="true" /> รีเซ็ต
        </Button>
      </div>
      {result ? (
        <Panel className="grid gap-2">
          {result.error ? (
            <>
              <p className="font-semibold text-signal">
                {result.error.name}
                {result.error.line ? ` บรรทัด ${result.error.line}` : ""}: {result.error.message}
              </p>
              {info ? <p className="text-sm">{info.meaning}</p> : null}
              {info ? <p className="text-sm text-muted">ตรวจ: {info.checks.join(" · ")}</p> : null}
            </>
          ) : (
            <pre className="font-mono text-sm whitespace-pre-wrap">{result.stdout || "(ไม่มีข้อความออก)"}</pre>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
