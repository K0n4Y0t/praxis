import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CHALLENGES } from "@/lib/curriculum/challenges";
import { useProgress } from "@/lib/progress/store";
import { runPython } from "@/lib/py/run";
import { Runner } from "@/components/runner";
import { Button, Eyebrow } from "@/components/ui";

export const Route = createFileRoute("/practice/$challengeId")({ component: ChallengePage });

function ChallengePage() {
  const { challengeId } = Route.useParams();
  const challenge = CHALLENGES.find((item) => item.id === challengeId);
  const data = useProgress();
  const [guess, setGuess] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [output, setOutput] = useState("");
  if (!challenge) return <p>ไม่พบโจทย์</p>;
  const state = data.challenges[challenge.id];

  if (challenge.kind === "predict") {
    return (
      <div className="grid gap-4">
        <Link to="/practice" className="text-sm text-accent">กลับโจทย์ฝึก</Link>
        <Eyebrow>ทายก่อนรัน</Eyebrow>
        <h1 className="text-3xl font-semibold">{challenge.title}</h1>
        <p>{challenge.prompt}</p>
        <pre className="overflow-auto rounded-md border border-line bg-surface p-4 font-mono text-sm whitespace-pre-wrap">{challenge.code}</pre>
        <label className="grid gap-2 text-sm">
          คำตอบที่ทาย
          <textarea value={guess} onChange={(event) => setGuess(event.target.value)} rows={3} className="rounded-md border border-line bg-surface p-3 font-mono" />
        </label>
        <Button
          type="button"
          onClick={() => {
            const ok = (challenge.accept ?? []).some((item) => item.trim() === guess.trim());
            setUnlocked(true);
            data.recordRun(challenge.id, "challenges", ok);
          }}
        >
          ล็อกคำทาย
        </Button>
        {unlocked ? (
          <Button type="button" variant="ghost" onClick={() => {
            const result = runPython(challenge.code);
            setOutput(result.error ? result.error.message : result.stdout);
          }}>
            รันเพื่อเทียบ
          </Button>
        ) : (
          <p className="text-sm text-muted">ปุ่มรันจะมากหลังคุณส่งคำทาย</p>
        )}
        {output ? <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre> : null}
        {state?.attempts ? <p className="text-sm">{state.passed ? "คำทายตรงกับผล" : "คำทายไม่ตรง ดูผลแล้วย้อนอ่านเงื่อนไข"}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Link to="/practice" className="text-sm text-accent">กลับโจทย์ฝึก</Link>
      <Eyebrow>{challenge.level}</Eyebrow>
      <h1 className="text-3xl font-semibold">{challenge.title}</h1>
      <p className="max-w-3xl leading-7">{challenge.prompt}</p>
      <Runner
        initial={challenge.code}
        tests={challenge.tests}
        hints={challenge.hints}
        solution={challenge.solution}
        solutionWhy={challenge.why}
        hintLevel={state?.hintLevel ?? 0}
        solutionSeen={state?.solutionSeen ?? false}
        onHint={(level) => data.openHint(challenge.id, "challenges", level)}
        onReveal={() => data.revealSolution(challenge.id, "challenges")}
        onGraded={(passed) => data.recordRun(challenge.id, "challenges", passed)}
      />
    </div>
  );
}
