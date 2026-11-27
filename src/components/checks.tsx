import { useState } from "react";
import type { Check } from "@/lib/curriculum/types";
import type { Attempt } from "@/lib/progress/scoring";
import { Button, Panel } from "./ui";
import { cn } from "@/lib/cn";

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function CheckList({
  checks,
  attempts,
  onAnswer,
}: {
  checks: Check[];
  attempts: Record<string, Attempt | undefined>;
  onAnswer: (id: string, correct: boolean) => void;
}) {
  return (
    <div className="grid gap-4">
      {checks.map((check, index) => (
        <CheckCard key={check.id} index={index + 1} check={check} attempt={attempts[check.id]} onAnswer={onAnswer} />
      ))}
    </div>
  );
}

function CheckCard({
  check,
  attempt,
  index,
  onAnswer,
}: {
  check: Check;
  attempt?: Attempt;
  index: number;
  onAnswer: (id: string, correct: boolean) => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const done = !!attempt && (attempt.correct || attempt.revealed);

  function submit() {
    if (check.kind === "mcq") {
      if (choice === null) return;
      onAnswer(check.id, choice === check.answer);
      return;
    }
    const ok = check.accept.some((item) => normalize(item) === normalize(text));
    onAnswer(check.id, ok);
  }

  const status = !attempt ? "ยังไม่ตอบ" : attempt.correct ? "ถูก" : attempt.revealed ? "เปิดคำอธิบายแล้ว" : "ยังไม่ถูก";

  return (
    <Panel className="grid gap-3">
      <p className="text-sm text-muted">
        คำถาม {index} · <span className="font-semibold text-fg">{status}</span>
      </p>
      <p className="text-[17px] leading-8 whitespace-pre-wrap">{check.prompt}</p>
      {check.kind === "mcq" ? (
        <div className="grid gap-2">
          {check.choices.map((item, itemIndex) => (
            <label
              key={item}
              className={cn(
                "flex min-h-11 items-start gap-3 rounded-xl border px-3 py-3 text-sm",
                choice === itemIndex ? "border-accent bg-accent-soft" : "border-line",
              )}
            >
              <input
                type="radio"
                name={check.id}
                className="mt-1"
                checked={choice === itemIndex}
                onChange={() => setChoice(itemIndex)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-11 rounded-xl border border-line bg-bg px-3 text-sm"
          aria-label="คำตอบ"
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={submit} disabled={attempt?.correct}>
          ส่งคำตอบ
        </Button>
        {attempt && !attempt.correct && !attempt.revealed ? (
          <p className="text-sm">ยังไม่ถูก ลองอีกครั้งโดยยังไม่ดูคำอธิบาย</p>
        ) : null}
        {attempt?.correct ? <p className="text-sm">ถูก</p> : null}
      </div>
      {done ? <p className="border-t border-line pt-3 text-sm">{check.explain}</p> : null}
      {attempt?.revealed && !attempt.correct ? (
        <p className="text-sm text-muted">เปิดคำอธิบายหลังตอบผิดสามครั้ง ข้อนี้ไม่นับว่าเข้าใจเอง</p>
      ) : null}
    </Panel>
  );
}
