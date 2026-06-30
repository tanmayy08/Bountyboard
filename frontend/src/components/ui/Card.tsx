import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "article" | "aside" | "div" | "section";
}

export function Card({ as: Component = "div", className, ...props }: CardProps) {
  const classes = cn("rounded-xl border border-zinc-800 bg-zinc-950", className);
  if (Component === "article") return <article className={classes} {...props} />;
  if (Component === "aside") return <aside className={classes} {...props} />;
  if (Component === "section") return <section className={classes} {...props} />;
  return <div className={classes} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-zinc-800 px-4 py-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
