"use client";

import { format } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { routing } from "@/i18n/routing";
import { getDateFnsLocaleForUi, normalizeDateLocale } from "@/lib/date-locale";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * Single-date picker: the range-free sibling of `date-picker.tsx`, reusing the
 * same Calendar + Popover. Value is `Date | null` so callers can clear it.
 */
export function DateField({
  value,
  onChange,
  disabled,
  className,
  placeholder,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("lists");
  const uiLocale = useLocale() as (typeof routing.locales)[number];
  const { data: session } = useSession();
  const dateLocale = normalizeDateLocale(session?.user.dateLocale);
  const dfLocale = getDateFnsLocaleForUi(uiLocale);

  function handleSelect(date: Date | undefined) {
    onChange(date ?? null);
    if (date) {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("flex items-center gap-1", className)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "grow justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "PPP", { locale: dfLocale })
            ) : (
              <span>{placeholder ?? t("dueDatePlaceholder")}</span>
            )}
          </Button>
        </PopoverTrigger>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={t("clearDueDate")}
            onClick={() => onChange(null)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          autoFocus
          mode="single"
          defaultMonth={value ?? undefined}
          selected={value ?? undefined}
          onSelect={handleSelect}
          dateLocale={dateLocale}
        />
      </PopoverContent>
    </Popover>
  );
}
