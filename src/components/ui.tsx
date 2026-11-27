import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Button({
  className,
  variant = "solid",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "quiet" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "solid" && "bg-accent text-accent-fg hover:brightness-110",
        variant === "ghost" && "border border-line bg-surface text-fg hover:bg-surface-2",
        variant === "quiet" && "bg-transparent px-3 text-muted hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-2xl border border-line bg-surface p-5", className)}>{children}</section>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">{children}</p>;
}
