import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Eyebrow, Panel } from "@/components/ui";
import { MACHINE_TASKS, matchMachineOutput, type MachineTask } from "@/lib/curriculum/machine";
import { useProgress } from "@/lib/progress/store";

export const Route = createFileRoute("/machine")({ component: MachinePage });

const TOOL: Record<MachineTask["tool"], string> = { shell: "เชลล์", git: "Git", sql: "SQL" };

function MachinePage() {
  const machine = useProgress((state) => state.machine);
  const markMachine = useProgress((state) => state.markMachine);
  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <Eyebrow>Ubuntu ของคุณ</Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">บนเครื่องจริง</h1>
        <p className="max-w-2xl text-muted">
          มีใบงานเชลล์ Git และ SQL ให้คัดลอกไปรันบน Ubuntu แล้ววางผลกลับมาเทียบ แอปนี้ไม่ได้รันคำสั่งเหล่านั้น ไม่มีเทอร์มินัลลับ และไม่ได้ติดต่อเครื่องคุณ
        </p>
      </header>
      {(["shell", "git", "sql"] as const).map((tool) => (
        <section key={tool} className="grid gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{TOOL[tool]}</h2>
          {MACHINE_TASKS.filter((task) => task.tool === tool).map((task) => (
            <TaskCard key={task.id} task={task} passed={Boolean(machine?.[task.id])} onMark={markMachine} />
          ))}
        </section>
      ))}
    </div>
  );
}

function TaskCard({
  task,
  passed,
  onMark,
}: {
  task: MachineTask;
  passed: boolean;
  onMark: (id: string, ok: boolean) => void;
}) {
  const [paste, setPaste] = useState("");
  const [verdict, setVerdict] = useState<"match" | "miss" | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(task.command);
    } catch {
      /* การเลือกข้อความด้านล่างยังใช้ได้ */
    }
  }

  return (
    <Panel className="grid gap-3">
      <p className="text-sm text-muted">{TOOL[task.tool]}</p>
      <h2 className="font-semibold">{task.title}</h2>
      {task.steps?.length ? (
        <ol className="grid list-decimal gap-1 pl-5 text-sm leading-6">
          {task.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      <pre className="overflow-auto rounded-2xl bg-bg/40 p-3 font-mono text-sm whitespace-pre-wrap">{task.command}</pre>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={() => void copy()}>
          คัดลอกคำสั่ง
        </Button>
        {passed ? <p className="self-center text-sm text-ok">ผลที่วางมาตรงแล้ว</p> : null}
      </div>
      <label className="grid gap-1 text-sm">
        วางข้อความจากเทอร์มินัล แอปเทียบตัวอักษรอย่างเดียว ไม่ได้รันคำสั่ง
        <textarea
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          rows={3}
          className="rounded-2xl border border-line bg-bg/40 p-3 font-mono text-sm"
          aria-label={`ผลของ ${task.title}`}
        />
      </label>
      <Button
        type="button"
        onClick={() => {
          const ok = matchMachineOutput(task.mode, task.expect, paste);
          setVerdict(ok ? "match" : "miss");
          onMark(task.id, ok);
        }}
      >
        เทียบผลที่วางมา
      </Button>
      {verdict === "match" ? <p className="text-sm text-ok">ข้อความที่วางมาตรงกับที่คาด แอปไม่ได้เป็นฝ่ายรันคำสั่ง</p> : null}
      {verdict === "miss" ? <p className="text-sm text-signal">ยังไม่ตรง {task.note}</p> : null}
      {verdict === null ? <p className="text-sm text-muted">{task.note}</p> : null}
    </Panel>
  );
}
