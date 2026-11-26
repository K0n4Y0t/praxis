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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "solid" && "bg-accent text-accent-fg hover:bg-accent/90",
        variant === "ghost" && "border border-line bg-surface-2 text-fg hover:bg-surface",
        variant === "quiet" && "bg-transparent px-3 text-muted hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-3xl bg-surface p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] md:bg-surface-2 md:shadow-none", className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium tracking-[0.14em] text-accent uppercase">{children}</p>;
}
