"use client";

import { useIsClient, useMediaQuery } from "@uidotdev/usehooks";
import { Check, ChevronsUpDown, Plus, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export type CategoryPickerProps = {
  categories: Category[];
  /** Selected category id, or null for "no category". */
  value: string | null;
  onChange: (categoryId: string | null) => void;
  /** Creates a category and resolves with its id. */
  onCreate: (name: string) => Promise<string>;
  disabled?: boolean;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
};

// Like responsive-menu.tsx: useMediaQuery throws on the server, so render the
// SSR-safe desktop (popover) branch until the client mounts, then switch.
export default function CategoryPicker(props: CategoryPickerProps) {
  const isClient = useIsClient();
  if (!isClient) {
    return <CategoryPickerView mode="desktop" {...props} />;
  }
  return <ClientCategoryPicker {...props} />;
}

function ClientCategoryPicker(props: CategoryPickerProps) {
  const isMdOrLarger = useMediaQuery("(min-width: 768px)");
  return (
    <CategoryPickerView mode={isMdOrLarger ? "desktop" : "mobile"} {...props} />
  );
}

type Row =
  | { type: "none" }
  | { type: "category"; category: Category }
  | { type: "create"; name: string };

/**
 * Builds the ordered list of picker rows for a search query: a "no category"
 * row (only when the query is empty), the categories matching the query, and a
 * "create" row when the trimmed query doesn't exactly match an existing name.
 */
export function buildCategoryRows(
  categories: Category[],
  query: string,
): Row[] {
  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();
  const filtered = needle
    ? categories.filter((c) => c.name.toLowerCase().includes(needle))
    : categories;
  const hasExactMatch = categories.some(
    (c) => c.name.trim().toLowerCase() === needle,
  );

  const rows: Row[] = [];
  if (trimmed === "") {
    rows.push({ type: "none" });
  }
  for (const category of filtered) {
    rows.push({ type: "category", category });
  }
  if (trimmed !== "" && !hasExactMatch) {
    rows.push({ type: "create", name: trimmed });
  }
  return rows;
}

function CategoryPickerView({
  mode,
  categories,
  value,
  onChange,
  onCreate,
  disabled,
  variant = "outline",
  className,
}: CategoryPickerProps & { mode: "desktop" | "mobile" }) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const selected = categories.find((c) => c.id === value) ?? null;
  const trimmedQuery = query.trim();

  const rows = useMemo(
    () => buildCategoryRows(categories, query),
    [categories, query],
  );
  const hasCategoryRows = rows.some((row) => row.type === "category");

  function reset() {
    setQuery("");
    setHighlight(0);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
    }
  }

  function select(row: Row) {
    if (row.type === "none") {
      onChange(null);
      handleOpenChange(false);
      return;
    }
    if (row.type === "category") {
      onChange(row.category.id);
      handleOpenChange(false);
      return;
    }
    void create(row.name);
  }

  async function create(name: string) {
    if (isCreating) {
      return;
    }
    setIsCreating(true);
    try {
      const categoryId = await onCreate(name);
      onChange(categoryId);
      handleOpenChange(false);
    } catch {
      // The error toast is surfaced by onCreate; keep the picker open to retry.
    } finally {
      setIsCreating(false);
    }
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, rows.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[highlight];
      if (row) {
        select(row);
      }
    }
  }

  const triggerLabel = selected?.name ?? tCommon("noCategory");

  const trigger = (
    <Button
      type="button"
      variant={variant}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      className={cn(
        "h-10 justify-between gap-2 font-normal sm:h-9",
        !selected && "text-muted-foreground",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Tag className="size-4 shrink-0 opacity-60" />
        <span className="truncate">{triggerLabel}</span>
      </span>
      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
    </Button>
  );

  const search = (
    <Input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setHighlight(0);
      }}
      onKeyDown={handleSearchKeyDown}
      placeholder={t("searchPlaceholder")}
      aria-label={t("searchPlaceholder")}
      autoFocus
      disabled={isCreating}
    />
  );

  const list = (
    <div role="listbox" className="flex flex-col gap-0.5">
      {trimmedQuery !== "" && !hasCategoryRows && (
        <div className="px-2 py-1.5 text-muted-foreground text-sm">
          {t("noResults")}
        </div>
      )}
      {rows.map((row, index) => (
        <OptionRow
          key={rowKey(row)}
          row={row}
          mode={mode}
          highlighted={index === highlight}
          isSelected={isRowSelected(row, value)}
          isCreating={isCreating && row.type === "create"}
          disabled={isCreating}
          createLabel={t("createNamed", {
            name: row.type === "create" ? row.name : "",
          })}
          noCategoryLabel={tCommon("noCategory")}
          onSelect={() => select(row)}
          onHover={() => setHighlight(index)}
        />
      ))}
    </div>
  );

  if (mode === "desktop") {
    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) min-w-56 p-2"
        >
          <div className="flex flex-col gap-2">
            {search}
            <div className="max-h-64 overflow-y-auto">{list}</div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="sr-only">
            {t("searchPlaceholder")}
          </DrawerTitle>
          {search}
        </DrawerHeader>
        <div className="max-h-[50vh] overflow-y-auto px-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
          {list}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function OptionRow({
  row,
  mode,
  highlighted,
  isSelected,
  isCreating,
  disabled,
  createLabel,
  noCategoryLabel,
  onSelect,
  onHover,
}: {
  row: Row;
  mode: "desktop" | "mobile";
  highlighted: boolean;
  isSelected: boolean;
  isCreating: boolean;
  disabled: boolean;
  createLabel: string;
  noCategoryLabel: string;
  onSelect: () => void;
  onHover: () => void;
}) {
  const label =
    row.type === "create"
      ? createLabel
      : row.type === "none"
        ? noCategoryLabel
        : row.category.name;

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={onSelect}
      onMouseMove={onHover}
      className={cn(
        "flex w-full cursor-pointer select-none items-center gap-2 rounded-md text-left outline-none disabled:cursor-not-allowed disabled:opacity-50",
        mode === "mobile" ? "px-4 py-3 text-base" : "px-2 py-1.5 text-sm",
        highlighted && "bg-accent text-accent-foreground",
        row.type === "create" && "text-primary",
      )}
    >
      {row.type === "create" ? (
        isCreating ? (
          <Spinner className="size-4 shrink-0" />
        ) : (
          <Plus className="size-4 shrink-0" />
        )
      ) : (
        <Check
          className={cn(
            "size-4 shrink-0",
            isSelected ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

function isRowSelected(row: Row, value: string | null): boolean {
  if (row.type === "none") {
    return value === null;
  }
  if (row.type === "category") {
    return row.category.id === value;
  }
  return false;
}

function rowKey(row: Row): string {
  if (row.type === "none") {
    return "row-none";
  }
  if (row.type === "category") {
    return `row-${row.category.id}`;
  }
  return "row-create";
}
