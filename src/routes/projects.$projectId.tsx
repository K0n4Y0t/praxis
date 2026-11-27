import { createFileRoute, Link } from "@tanstack/react-router";
import { PROJECT_MAP } from "@/lib/curriculum/projects";
import { useProgress } from "@/lib/progress/store";
import { Runner } from "@/components/runner";
import { Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectPage });

function ProjectPage() {
  const { projectId } = Route.useParams();
  const project = PROJECT_MAP.get(projectId);
  const data = useProgress();
  if (!project) return <p>ไม่พบโครงงาน</p>;
  const marked = new Set(data.projects[project.id] ?? []);
  const labState = project.lab ? data.labs[project.lab.id] : undefined;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Eyebrow>ภาค {project.semester}</Eyebrow>
        <h1 className="text-4xl font-semibold">{project.title}</h1>
        <p className="max-w-3xl leading-7">{project.problem}</p>
      </header>
      <Block title="ความต้องการ" items={project.requirements} />
      <Block title="ข้อกำหนดทางเทคนิค" items={project.spec} />
      <Block title="ลำดับงาน" items={project.tasks} />
      <Panel>
        <h2 className="font-semibold">หลักไมล์ที่ติ๊กเอง</h2>
        <p className="mt-2 text-sm text-muted">นี่ไม่ใช่การตรวจผ่าน ติ๊กเมื่อคุณทำข้อนั้นบนเครื่องจริงได้แล้ว</p>
        <ul className="mt-3 grid gap-2">
          {project.milestones.map((milestone) => (
            <li key={milestone.id}>
              <label className="flex min-h-11 items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={marked.has(milestone.id)}
                  onChange={() => data.toggleMilestone(project.id, milestone.id)}
                />
                <span>{milestone.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </Panel>
      <Block title="สิ่งที่ต้องทดสอบ" items={project.tests} />
      <Block title="เกณฑ์ประเมิน" items={project.criteria} />
      <Block title="เอกสารที่ต้องมี" items={project.docs} />
      <Block title="คำถามปิดงาน" items={project.review} />
      {project.lab ? (
        <section className="grid gap-3">
          <h2 className="text-2xl font-semibold">ตัวตรวจในเบราว์เซอร์</h2>
          <p className="text-sm text-muted">นี่คือกติกาที่ตรวจได้ในหน้า งานที่ต้องใช้เครื่องจริงยังอยู่ที่หลักไมล์ด้านบน และไม่ถูกนับว่าทำแล้วเพียงเพราะเทสต์นี้ผ่าน</p>
          <p>{project.lab.prompt}</p>
          <Runner
            initial={project.lab.starter}
            tests={project.lab.tests}
            hints={project.lab.hints}
            solution={project.lab.solution}
            solutionWhy={project.lab.solutionWhy}
            hintLevel={labState?.hintLevel ?? 0}
            solutionSeen={labState?.solutionSeen ?? false}
            onHint={(level) => data.openHint(project.lab!.id, "labs", level)}
            onReveal={() => data.revealSolution(project.lab!.id, "labs")}
            onGraded={(passed) => data.recordRun(project.lab!.id, "labs", passed)}
          />
        </section>
      ) : (
        <p className="text-sm text-muted">ภาคนี้ยังไม่มีตัวตรวจอัตโนมัติทั้งก้อน การติ๊กหลักไมล์คือการประเมินตนเอง</p>
      )}
      <Link to="/curriculum/$semesterId" params={{ semesterId: String(project.semester) }} className="text-sm font-semibold text-accent">
        กลับไปที่ภาค {project.semester}
      </Link>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <Panel>
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Panel>
  );
}
