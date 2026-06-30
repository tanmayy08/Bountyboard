import { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-36 w-full rounded-md border border-zinc-800 bg-[#08090c] px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500",
        className,
      )}
      {...props}
    />
  );
}
