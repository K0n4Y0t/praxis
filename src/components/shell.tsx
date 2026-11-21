import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Library,
  LineChart,
  Menu,
  Moon,
  NotebookPen,
  Puzzle,
  SquareTerminal,
  Sun,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useProgress } from "@/lib/progress/store";

const NAV = [
  { to: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { to: "/curriculum", label: "หลักสูตร", icon: Library },
  { to: "/playground", label: "สนามทดลอง", icon: SquareTerminal },
  { to: "/practice", label: "โจทย์ฝึก", icon: Puzzle },
  { to: "/projects", label: "โครงงาน", icon: FolderKanban },
  { to: "/planner", label: "ตารางวัน", icon: CalendarDays },
  { to: "/journal", label: "สมุดบันทึก", icon: NotebookPen },
  { to: "/progress", label: "ความเชี่ยวชาญ", icon: LineChart },
  { to: "/handbook", label: "คู่มือระบบ", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const hydrated = useProgress((state) => state.hydrated);
  const addSeconds = useProgress((state) => state.addSeconds);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("praxis-theme");
    const next = stored === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    const unsub = useProgress.persist.onFinishHydration(() => {
      useProgress.getState().markHydrated();
    });
    void useProgress.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (path.startsWith("/learn") || path.startsWith("/practice") || path.startsWith("/playground") || path.startsWith("/projects")) {
        addSeconds(30);
      }
    }, 30000);
    return () => window.clearInterval(timer);
  }, [path, addSeconds]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("praxis-theme", next);
    setTheme(next);
  }

  return (
    <div className="min-h-screen bg-bg text-fg md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-surface md:flex md:flex-col">
        <Brand />
        <Nav path={path} />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-bg/80" aria-label="ปิดเมนู" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 flex-col border-r border-line bg-surface">
            <div className="flex items-center justify-between px-4 pt-4">
              <Brand compact />
              <button className="grid size-11 place-items-center" onClick={() => setOpen(false)} aria-label="ปิด">
                <X className="size-5" />
              </button>
            </div>
            <Nav path={path} />
          </div>
        </div>
      ) : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/95 px-4 py-2 backdrop-blur md:px-8">
          <button className="grid size-11 place-items-center md:hidden" onClick={() => setOpen(true)} aria-label="เปิดเมนู">
            <Menu className="size-5" />
          </button>
          <p className="hidden text-sm text-muted md:block">เรียนวันละสองชั่วโมง · ทฤษฎี ลงมือ แบบฝึก ทบทวน</p>
          <button className="grid size-11 place-items-center" onClick={toggleTheme} aria-label={theme === "dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}>
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {hydrated ? children : <p className="text-muted">กำลังเปิดสมุดความคืบหน้าบนเครื่องนี้</p>}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("block px-5 py-6", compact && "px-0 py-0")}>
      <p className="text-2xl font-semibold tracking-tight">Praxis</p>
      <p className="text-sm text-muted">สำนักวิศวกรรมซอฟต์แวร์</p>
    </Link>
  );
}

function Nav({ path }: { path: string }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 pb-6" aria-label="หลัก">
      {NAV.map((item) => {
        const active = item.to === "/" ? path === "/" : path === item.to || path.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm",
              active ? "bg-surface-2 font-semibold text-fg" : "text-muted",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
