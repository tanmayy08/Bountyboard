import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { Link, LinkProps } from "react-router-dom";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

interface BaseButtonProps {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseButtonProps {}

interface ButtonLinkProps extends LinkProps, BaseButtonProps {}

interface ExternalButtonLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    BaseButtonProps {
  href: string;
}

const buttonClasses = ({
  className,
  size = "md",
  variant = "primary",
}: Pick<BaseButtonProps, "className" | "size" | "variant">) =>
  cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "h-9 px-3",
    size === "md" && "h-11 px-4",
    size === "icon" && "h-10 w-10 px-0",
    variant === "primary" && "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
    variant === "outline" &&
      "border border-zinc-700 bg-zinc-950 text-zinc-100 hover:border-emerald-500 hover:text-emerald-200",
    variant === "ghost" && "text-zinc-300 hover:bg-zinc-900 hover:text-white",
    variant === "danger" &&
      "border border-red-500/40 bg-transparent text-red-200 hover:border-red-400 hover:bg-red-500/10",
    className,
  );

export function Button({ className, size, variant, ...props }: ButtonProps) {
  return (
    <button
      className={buttonClasses({ className, size, variant })}
      {...props}
    />
  );
}

export function ButtonLink({ className, size, variant, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ className, size, variant })} {...props} />;
}

export function ExternalButtonLink({
  className,
  size,
  variant,
  ...props
}: ExternalButtonLinkProps) {
  return <a className={buttonClasses({ className, size, variant })} {...props} />;
}
