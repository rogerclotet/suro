"use client";

import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  FlagIcon,
  RepeatIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import type { ProjectMember } from "@/app/_data/project";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import UserAvatar from "@/components/user-avatar";
import { normalizeDateLocale } from "@/lib/date-locale";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  type ListItemFormValues,
  PRIORITIES,
  RECURRENCE_PRESETS,
} from "./data";

// Icon-only compact triggers (the field name lives in the dropdown), so all four
// controls plus the category picker fit on one add row. `ChevronsUpDown` matches
// the category picker's chevron; the leading icon brightens once a value is set.
const TRIGGER =
  "inline-flex h-10 items-center gap-1 rounded-md px-2 outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent sm:h-9";

const PRIORITY_ICON_COLOR: Record<"low" | "normal" | "high", string> = {
  low: "text-muted-foreground",
  // Normal is the default, so it reads neutral like the other unset controls.
  normal: "opacity-70",
  high: "text-destructive",
};

/**
 * The new-item assignee/priority/due/repeat controls, rendered inline in the add
 * row beside the category picker (as siblings, so the row's gap spaces them
 * evenly). Only mounted on task-mode lists. Each is an icon-only popover trigger;
 * the popover names the field and holds its options.
 */
export function NewItemTaskControls({
  control,
  members,
}: {
  control: Control<ListItemFormValues>;
  members: ProjectMember[];
}) {
  return (
    <>
      <AssigneeControl control={control} members={members} />
      <PriorityControl control={control} />
      <DueControl control={control} />
      <RepeatControl control={control} />
    </>
  );
}

/**
 * A labelled options popover with an icon-only trigger. The trigger button is
 * inlined directly under `PopoverTrigger asChild` so Radix's click/ref reach the
 * real <button> (a wrapper component would swallow them and never open). The
 * render-prop hands children a `close` so picking an option dismisses the popover.
 */
function PickerPopover({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className={TRIGGER}>
          {icon}
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
          {label}
        </div>
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

/** A selectable row inside a picker popover, with a leading check when active. */
function OptionRow({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
    >
      <Check
        className={cn(
          "size-4 shrink-0",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
      {children}
    </button>
  );
}

function DueControl({ control }: { control: Control<ListItemFormValues> }) {
  return (
    <Controller
      control={control}
      name="dueAt"
      render={({ field }) => (
        <DuePopover dueAt={field.value} onDueAtChange={field.onChange} />
      )}
    />
  );
}

/** Due dates are date-only (all-day): just a calendar, no time/all-day controls. */
function DuePopover({
  dueAt,
  onDueAtChange,
}: {
  dueAt: Date | null;
  onDueAtChange: (date: Date | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("lists");
  const { data: session } = useSession();
  const dateLocale = normalizeDateLocale(session?.user.dateLocale);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={t("dueDate")} className={TRIGGER}>
          <CalendarIcon
            className={cn(
              "size-4 shrink-0",
              dueAt ? "text-foreground" : "opacity-70",
            )}
          />
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="border-b px-4 py-2.5 font-medium text-muted-foreground text-xs">
          {t("dueDate")}
        </div>
        <Calendar
          autoFocus
          mode="single"
          defaultMonth={dueAt ?? undefined}
          selected={dueAt ?? undefined}
          onSelect={(date) => {
            onDueAtChange(date ?? null);
            if (date) {
              setOpen(false);
            }
          }}
          dateLocale={dateLocale}
        />
        {dueAt ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onDueAtChange(null);
                setOpen(false);
              }}
            >
              <XIcon className="size-4" />
              {t("clearDueDate")}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function AssigneeControl({
  control,
  members,
}: {
  control: Control<ListItemFormValues>;
  members: ProjectMember[];
}) {
  const t = useTranslations("lists");
  return (
    <Controller
      control={control}
      name="assigneeId"
      render={({ field }) => {
        const selected = members.find((m) => m.user.id === field.value)?.user;
        return (
          <PickerPopover
            label={t("assignee")}
            icon={
              selected ? (
                <UserAvatar user={selected} className="size-5 shrink-0" />
              ) : (
                <UserIcon className="size-4 shrink-0 opacity-70" />
              )
            }
          >
            {(close) => (
              <>
                <OptionRow
                  selected={field.value === null}
                  onSelect={() => {
                    field.onChange(null);
                    close();
                  }}
                >
                  {t("unassigned")}
                </OptionRow>
                {members.map(({ user }) => (
                  <OptionRow
                    key={user.id}
                    selected={field.value === user.id}
                    onSelect={() => {
                      field.onChange(user.id);
                      close();
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <UserAvatar user={user} className="size-5" />
                      {user.name}
                    </span>
                  </OptionRow>
                ))}
              </>
            )}
          </PickerPopover>
        );
      }}
    />
  );
}

function PriorityControl({
  control,
}: {
  control: Control<ListItemFormValues>;
}) {
  const t = useTranslations("lists");
  return (
    <Controller
      control={control}
      name="priority"
      render={({ field }) => (
        <PickerPopover
          label={t("priority")}
          icon={
            <FlagIcon
              className={cn(
                "size-4 shrink-0",
                field.value ? PRIORITY_ICON_COLOR[field.value] : "opacity-70",
              )}
            />
          }
        >
          {(close) =>
            PRIORITIES.map((priority) => (
              <OptionRow
                key={priority}
                selected={field.value === priority}
                onSelect={() => {
                  field.onChange(priority);
                  close();
                }}
              >
                <FlagIcon
                  className={cn(
                    "size-4 shrink-0",
                    PRIORITY_ICON_COLOR[priority],
                  )}
                />
                {t(`priority_${priority}`)}
              </OptionRow>
            ))
          }
        </PickerPopover>
      )}
    />
  );
}

function RepeatControl({ control }: { control: Control<ListItemFormValues> }) {
  const t = useTranslations("lists");
  return (
    <Controller
      control={control}
      name="recurrence"
      render={({ field }) => (
        <PickerPopover
          label={t("repeat")}
          icon={
            <RepeatIcon
              className={cn(
                "size-4 shrink-0",
                field.value === "none" ? "opacity-70" : "text-foreground",
              )}
            />
          }
        >
          {(close) =>
            RECURRENCE_PRESETS.map((preset) => (
              <OptionRow
                key={preset}
                selected={field.value === preset}
                onSelect={() => {
                  field.onChange(preset);
                  close();
                }}
              >
                {t(`repeat_${preset}`)}
              </OptionRow>
            ))
          }
        </PickerPopover>
      )}
    />
  );
}
