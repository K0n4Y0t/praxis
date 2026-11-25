import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckList } from "@/components/checks";
import { Eyebrow, Panel } from "@/components/ui";
import { recallKey, retrievalPicks } from "@/lib/curriculum/recall";
import { mondayOf, weekDays, bangkokDate } from "@/lib/progress/dates";
import { useProgress } from "@/lib/progress/store";

export const Route = createFileRoute("/recall")({ component: RecallPage });

function RecallPage() {
  const data = useProgress();
  const week = mondayOf(bangkokDate());
  const days = weekDays(week);
  const picks = retrievalPicks(data, week, 4);
  const attempts = Object.fromEntries(picks.map((pick) => [pick.check.id, data.recall?.[recallKey(week, pick.check.id)]]));

  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <Eyebrow>
          {days[0]} ถึง {days[6]}
        </Eyebrow>
        <h1 className="text-4xl font-semibold">ดึงความจำ</h1>
        <p className="max-w-2xl text-muted">
          สี่ข้อจากบทที่ผ่านเกณฑ์แล้ว ชุดนี้คงที่ทั้งสัปดาห์ ตอบผิดแล้วกลับไปบทนั้น คะแนนบทเดิมไม่ถูกหัก
        </p>
      </header>
      {picks.length === 0 ? (
        <Panel>
          <p>ยังไม่มีบทที่ผ่านเกณฑ์ จึงยังไม่ดึงความจำ ผ่านคำถามและแล็บของบทแรกก่อน</p>
          <Link to="/curriculum" className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent">
            เปิดหลักสูตร
          </Link>
        </Panel>
      ) : (
        <div className="grid gap-4">
          {picks.map((pick) => {
            const attempt = data.recall?.[recallKey(week, pick.check.id)];
            const missed = attempt && !attempt.correct;
            return (
              <div key={pick.check.id} className="grid gap-2">
                <p className="text-sm text-muted">จากบท {pick.lesson.title}</p>
                <CheckList
                  checks={[pick.check]}
                  attempts={attempts}
                  onAnswer={(id, correct) => data.answerRecall(recallKey(week, id), correct)}
                />
                {missed ? (
                  <Link
                    to="/learn/$lessonId"
                    params={{ lessonId: pick.lesson.id }}
                    className="inline-flex min-h-11 items-center font-semibold text-signal"
                  >
                    ยังไม่ติด กลับไปบท {pick.lesson.title}
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
