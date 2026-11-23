import { createFileRoute, Link } from "@tanstack/react-router";
import { PROJECTS } from "@/lib/curriculum/projects";
import { useProgress } from "@/lib/progress/store";
import { Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/projects/")({ component: ProjectHome });

function ProjectHome() {
  const projects = useProgress((state) => state.projects);
  const labs = useProgress((state) => state.labs);
  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <Eyebrow>หนึ่งภาค หนึ่งของจริง</Eyebrow>
        <h1 className="text-4xl font-semibold">โครงงาน</h1>
        <p className="max-w-2xl text-muted">
          ทุกภาคมีฟังก์ชันแกนที่ตัวตรวจรันในหน้านี้ เป็นแบบจำลองของกติกา ไม่ใช่เชลล์ ฐานข้อมูล หรือคอมโพสจริง งานที่ต้องเกิดบนเครื่องคุณยังเป็นการติ๊กหลักไมล์เมื่อทำจริง
        </p>
      </header>
      <div className="grid gap-3">
        {PROJECTS.map((project) => {
          const done = (projects[project.id] ?? []).length;
          const core = project.lab && labs[project.lab.id]?.passed ? "แกนผ่าน" : "แกนยัง";
          return (
            <Link key={project.id} to="/projects/$projectId" params={{ projectId: project.id }}>
              <Panel className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">ภาค {project.semester}</p>
                  <h2 className="font-semibold">{project.title}</h2>
                </div>
                <p className="text-sm tabular-nums text-muted">{core} · {done}/{project.milestones.length}</p>
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
