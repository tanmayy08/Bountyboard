import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "../../lib/utils";

export function Calendar({ className, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn("text-sm text-zinc-100", className)}
      classNames={{
        months: "flex flex-col",
        month_caption: "flex h-9 items-center justify-center text-sm font-medium",
        nav: "absolute right-3 top-3 flex items-center gap-1",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 hover:text-white",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 hover:text-white",
        weekdays: "mt-2 grid grid-cols-7 text-xs text-zinc-500",
        weekday: "flex h-8 items-center justify-center",
        week: "grid grid-cols-7",
        day: "flex h-9 w-9 items-center justify-center rounded-full text-sm text-zinc-300 hover:bg-zinc-900",
        selected: "bg-emerald-500 text-zinc-950 hover:bg-emerald-500",
        today: "border border-emerald-500/50",
        outside: "text-zinc-700",
        disabled: "pointer-events-none text-zinc-700",
      }}
      {...props}
    />
  );
}
