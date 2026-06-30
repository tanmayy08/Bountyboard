import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
        variant === "outline" &&
          "border border-zinc-700 bg-zinc-950 text-zinc-100 hover:border-emerald-500 hover:text-emerald-200",
        variant === "ghost" && "text-zinc-300 hover:bg-zinc-900 hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
