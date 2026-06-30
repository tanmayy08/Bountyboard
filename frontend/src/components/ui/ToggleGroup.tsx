import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "../../lib/utils";

export const ToggleGroup = ToggleGroupPrimitive.Root;

export function ToggleGroupItem({
  className,
  ...props
}: ToggleGroupPrimitive.ToggleGroupItemProps) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "inline-flex h-9 flex-1 items-center justify-center rounded px-3 text-sm font-medium text-zinc-400 transition hover:text-white data-[state=on]:bg-emerald-500 data-[state=on]:text-zinc-950",
        className,
      )}
      {...props}
    />
  );
}
