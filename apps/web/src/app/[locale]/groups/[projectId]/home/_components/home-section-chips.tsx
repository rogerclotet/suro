"use client";

import { FileTextIcon, FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HOME_SECTIONS } from "@/lib/home-sections";
import { cn } from "@/lib/utils";

/** Compact section shortcuts below the home date header. Wraps to a second row. */
export function HomeSectionChips({ projectId }: { projectId: string }) {
  const tNav = useTranslations("nav");

  return (
    <div className="flex flex-wrap gap-2">
      {HOME_SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <Link
            key={section.key}
            href={{
              pathname: `/groups/[projectId]/${section.key}`,
              params: { projectId },
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5",
              "font-semibold text-[13px] text-foreground transition-opacity hover:opacity-70",
            )}
          >
            <Icon size={14} className="shrink-0 text-primary" aria-hidden />
            {tNav(section.key)}
          </Link>
        );
      })}
    </div>
  );
}
