import { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 rounded-full border border-zinc-800 bg-[#08090c] px-3 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500",
        className,
      )}
      {...props}
    />
  );
}
