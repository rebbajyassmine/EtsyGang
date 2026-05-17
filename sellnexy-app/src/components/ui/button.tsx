import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "default" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-[0_12px_32px_rgba(251,191,36,0.22)]",
  secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
  outline: "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
  ghost: "text-slate-200 hover:bg-white/8",
  destructive: "bg-rose-500 text-white hover:bg-rose-400",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  default: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:pointer-events-none disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}