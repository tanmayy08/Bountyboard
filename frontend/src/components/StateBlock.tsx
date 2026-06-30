import { AlertCircle, Loader2 } from "lucide-react";
import { Card } from "./ui/Card";

interface StateBlockProps {
  title: string;
  message: string;
  type?: "empty" | "error" | "loading";
}

export function StateBlock({ title, message, type = "empty" }: StateBlockProps) {
  const Icon = type === "loading" ? Loader2 : AlertCircle;

  return (
    <Card
      as="section"
      className="flex min-h-52 flex-col items-center justify-center border-dashed bg-zinc-950/50 px-4 py-8 text-center"
    >
      <Icon
        aria-hidden="true"
        className={type === "loading" ? "animate-spin text-emerald-400" : "text-zinc-500"}
        size={24}
      />
      <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-zinc-400">{message}</p>
    </Card>
  );
}
