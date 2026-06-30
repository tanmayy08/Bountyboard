import { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-zinc-800 bg-[#08090c] px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500",
        className,
      )}
      {...props}
    />
  );
}
