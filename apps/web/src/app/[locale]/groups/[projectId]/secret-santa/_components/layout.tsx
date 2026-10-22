import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The muted uppercase micro-header the list categories use. */
export function SectionLabel({
  children,
  count,
}: {
  children: ReactNode;
  count?: number;
}) {
  return (
    <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
      {children}
      {count !== undefined && ` · ${count}`}
    </h3>
  );
}

/** A plain status line: where the Secret Santa stands, or what blocks it. */
export function StatusLine({
  icon: Icon,
  text,
  tone = "info",
}: {
  icon: LucideIcon;
  text: string;
  tone?: "info" | "warning";
}) {
  const warning = tone === "warning";
  return (
    <p
      role={warning ? "alert" : undefined}
      className={cn(
        "flex items-start gap-2 text-sm",
        warning ? "text-destructive" : "text-muted-foreground",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
