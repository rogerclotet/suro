"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { List } from "@/app/_data/list";
import { cn } from "@/lib/utils";
import ListPreview from "./list-preview";

export default function CollapsibleCompletedSection({
  lists,
}: {
  lists: List[];
}) {
  const [open, setOpen] = useState(false);

  if (lists.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-1 text-muted-foreground"
      >
        <span className="text-xs font-semibold uppercase tracking-wide">
          Completades
        </span>
        <span className="rounded-lg bg-muted px-[7px] py-px text-xs font-semibold">
          {lists.length}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-1.5">
          {lists.map((list) => (
            <ListPreview key={list.id} list={list} compact />
          ))}
        </div>
      )}
    </div>
  );
}
