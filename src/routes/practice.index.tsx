import { createFileRoute, Link } from "@tanstack/react-router";
import { CHALLENGES } from "@/lib/curriculum/challenges";
import type { LabState } from "@/lib/progress/scoring";
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
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">โจทย์ฝึก</h1>
        <p className="max-w-2xl text-muted">
          ภาค 1–3 มีโจทย์ดีบักเพิ่มที่ฟังก์ชัน ลูป และ Big O เพราะพื้นฐานพังตรงนั้นบ่อย ภาคหลังยังมีโจทย์ภาคละข้อ เฉลยเต็มกดความเชี่ยวชาญของข้อนั้นลง
        </p>
      </header>
      <div className="grid gap-6">
        <ChallengeGroup title="ภาค 1–3 · ฟังก์ชัน ลูป และ Big O" items={CHALLENGES.filter((item) => item.semester <= 3)} challenges={challenges} />
        <ChallengeGroup title="ภาค 4 เป็นต้นไป" items={CHALLENGES.filter((item) => item.semester > 3)} challenges={challenges} />
      </div>
    </div>
  );
}

function ChallengeGroup({
  title,
  items,
  challenges,
}: {
  title: string;
  items: typeof CHALLENGES;
  challenges: Record<string, LabState | undefined>;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {items.map((challenge) => {
        const state = challenges[challenge.id];
        const status = !state ? "ยังไม่ทำ" : state.passed && !state.solutionSeen ? "ผ่านโดยไม่เปิดเฉลย" : state.passed ? "ผ่านหลังเห็นเฉลย" : "ยังไม่ผ่าน";
        return (
          <Link key={challenge.id} to="/practice/$challengeId" params={{ challengeId: challenge.id }}>
            <Panel className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">
                  ภาค {challenge.semester} · {KIND[challenge.kind]} · {challenge.level}
                </p>
                <h3 className="font-semibold">{challenge.title}</h3>
              </div>
              <p className="shrink-0 text-sm text-muted">{status}</p>
            </Panel>
          </Link>
        );
      })}
    </section>
  );
}
