import { createFileRoute, Link } from "@tanstack/react-router";
import { CHALLENGES } from "@/lib/curriculum/challenges";
import { useProgress } from "@/lib/progress/store";
import { Eyebrow, Panel } from "@/components/ui";

const KIND: Record<string, string> = {
  debug: "แก้บั๊ก",
  predict: "ทายผล",
  find: "หาจุดผิด",
  reverse: "ย้อนจากผล",
  design: "เลือกวิธี",
};

export const Route = createFileRoute("/practice/")({ component: PracticeHome });

function PracticeHome() {
  const challenges = useProgress((state) => state.challenges);
  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <Eyebrow>ลองผิดโดยมีร่องรอย</Eyebrow>
        <h1 className="text-4xl font-semibold">โจทย์ฝึก</h1>
        <p className="max-w-2xl text-muted">เฉลยเต็มอยู่ที่ระดับ 5 และจะกดความเชี่ยวชาญของข้อนั้นลง ผ่านจริงคือทำให้เทสต์ผ่านก่อนเปิดเฉลย</p>
      </header>
      <div className="grid gap-3">
        {CHALLENGES.map((challenge) => {
          const state = challenges[challenge.id];
          const status = !state ? "ยังไม่ทำ" : state.passed && !state.solutionSeen ? "ผ่านโดยไม่เปิดเฉลย" : state.passed ? "ผ่านหลังเห็นเฉลย" : "ยังไม่ผ่าน";
          return (
            <Link key={challenge.id} to="/practice/$challengeId" params={{ challengeId: challenge.id }}>
              <Panel className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">ภาค {challenge.semester} · {KIND[challenge.kind]} · {challenge.level}</p>
                  <h2 className="font-semibold">{challenge.title}</h2>
                </div>
                <p className="text-sm text-muted">{status}</p>
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
