"use client";

import { CalendarDays, ChevronRight, ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type CalendarItem = { id: string; name: string; completed: boolean };

export default function CalendarDemo() {
  const t = useTranslations("info");
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<CalendarItem[]>([
    { id: "i-1", name: t("demoListsItemSwimsuit"), completed: true },
    { id: "i-2", name: t("demoListsItemJacket"), completed: false },
    { id: "i-3", name: t("demoListsItemSunscreen"), completed: true },
    { id: "i-4", name: t("demoListsItemTrain"), completed: false },
  ]);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, completed: !it.completed } : it,
      ),
    );
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>{t("demoCalendarEventName")}</CardTitle>
            <CardDescription className="mt-1">
              {t("demoCalendarEventDate")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-md py-1 text-left text-sm transition-colors hover:bg-muted/50"
          aria-expanded={open}
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
          />
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {t("demoCalendarLinkedListLabel")}
          </span>
          <span className="ml-auto text-muted-foreground text-xs">
            {items.filter((i) => i.completed).length} / {items.length}
          </span>
        </button>
        {open && (
          <ul className="mt-2 flex flex-col gap-2 pl-6">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                <Checkbox
                  id={`demo-cal-${it.id}`}
                  checked={it.completed}
                  onCheckedChange={() => toggle(it.id)}
                />
                <label
                  htmlFor={`demo-cal-${it.id}`}
                  className={cn(
                    "cursor-pointer text-sm",
                    it.completed && "text-muted-foreground line-through",
                  )}
                >
                  {it.name}
                </label>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
