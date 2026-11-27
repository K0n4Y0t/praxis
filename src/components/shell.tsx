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
  RotateCcw,
  Server,
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
  { to: "/recall", label: "ดึงความจำ", icon: RotateCcw },
  { to: "/machine", label: "บนเครื่อง", icon: Server },
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
      if (path.startsWith("/learn") || path.startsWith("/practice") || path.startsWith("/playground") || path.startsWith("/projects") || path.startsWith("/recall") || path.startsWith("/machine")) {
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
    <div className="min-h-dvh bg-bg text-fg md:grid md:h-dvh md:grid-cols-[15rem_minmax(0,1fr)] md:overflow-hidden">
      <aside className="hidden border-r border-line bg-surface md:flex md:flex-col">
        <Brand />
        <Nav path={path} />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-black/50" aria-label="ปิดเมนู" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[min(86dvh,40rem)] flex-col rounded-t-2xl border border-line bg-surface">
            <div className="flex justify-center pt-3">
              <span className="h-1 w-8 rounded-full bg-line" />
            </div>
            <div className="flex items-center justify-between px-4 pt-3">
              <Brand compact />
              <button className="grid size-11 place-items-center rounded-lg" onClick={() => setOpen(false)} aria-label="ปิด">
                <X className="size-5" />
              </button>
            </div>
            <Nav path={path} />
          </div>
        </div>
      ) : null}
      <div className="flex min-h-dvh min-w-0 flex-col md:min-h-0 md:overflow-hidden">
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-line bg-bg/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md md:px-8">
          <button className="grid size-11 place-items-center rounded-lg md:hidden" onClick={() => setOpen(true)} aria-label="เปิดเมนู">
            <Menu className="size-5" />
          </button>
          <p className="hidden text-sm text-muted md:block">วันละสองชั่วโมง · อ่าน ลงมือ ตรวจ แล้วค่อยไปต่อ</p>
          <button className="ml-auto grid size-11 place-items-center rounded-lg" onClick={toggleTheme} aria-label={theme === "dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}>
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:overflow-y-auto md:px-8">
          {hydrated ? children : <p className="text-muted">กำลังเปิดสมุดความคืบหน้าบนเครื่องนี้</p>}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3 px-5 py-6", compact && "px-0 py-0")}>
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-semibold text-accent-fg">P</span>
      <span>
        <p className="text-lg font-semibold tracking-tight">Praxis</p>
        <p className="text-xs text-muted">สำนักวิศวกรรมซอฟต์แวร์</p>
      </span>
    </Link>
  );
}

function Nav({ path }: { path: string }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]" aria-label="หลัก">
      {NAV.map((item) => {
        const active = item.to === "/" ? path === "/" : path === item.to || path.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm",
              active ? "bg-accent-soft font-semibold text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className={cn("size-4", active && "text-accent")} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
