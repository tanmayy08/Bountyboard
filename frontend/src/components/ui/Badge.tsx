import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "info" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variant === "default" && "border-zinc-800 bg-zinc-950 text-zinc-300",
        variant === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        variant === "info" && "border-sky-500/30 bg-sky-500/10 text-sky-200",
        variant === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-200",
        className,
      )}
      {...props}
    />
  );
}
