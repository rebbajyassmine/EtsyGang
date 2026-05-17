import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

const styles: Record<BadgeVariant, string> = {
  default: "border border-amber-300/25 bg-amber-300/8 text-amber-100",
  secondary: "border border-slate-500/25 bg-slate-500/8 text-slate-200",
  outline: "border border-white/10 bg-white/5 text-slate-200",
};

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", styles[variant], className)} {...props} />;
}