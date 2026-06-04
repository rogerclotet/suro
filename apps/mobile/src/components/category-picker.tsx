import type { Id } from "backend/convex/_generated/dataModel";
import { Check, ChevronDown, Plus, Tag } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Field, Txt } from "@/ui";

export type PickerCategory = { _id: Id<"categories">; name: string };

type Row =
  | { type: "none" }
  | { type: "category"; category: PickerCategory }
  | { type: "create"; name: string };

/**
 * Ordered picker rows for a query — ported from the PWA's buildCategoryRows: a
 * "no category" row (only when the query is empty), the categories matching the
 * query, and a "create" row when the trimmed query has no exact name match.
 */
export function buildCategoryRows(
  categories: PickerCategory[],
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

/**
 * Inline-expandable category selector. Renders a trigger that toggles an in-flow
 * panel (search + options), so it composes inside a Sheet or a screen without
 * stacking modals. Supports inline category creation via `onCreate`.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  onCreate,
}: {
  categories: PickerCategory[];
  value: Id<"categories"> | null;
  onChange: (categoryId: Id<"categories"> | null) => void;
  onCreate: (name: string) => Promise<Id<"categories">>;
}) {
  const t = useTheme();
  const tcat = useTranslations("mobile.categories");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = categories.find((c) => c._id === value) ?? null;
  const rows = useMemo(
    () => buildCategoryRows(categories, query),
    [categories, query],
  );
  const trimmedQuery = query.trim();
  const hasCategoryRows = rows.some((row) => row.type === "category");

  function close() {
    setOpen(false);
    setQuery("");
  }

  async function select(row: Row) {
    if (row.type === "none") {
      onChange(null);
      close();
      return;
    }
    if (row.type === "category") {
      onChange(row.category._id);
      close();
      return;
    }
    if (creating) {
      return;
    }
    setCreating(true);
    try {
      const id = await onCreate(row.name);
      onChange(id);
      close();
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 11,
          backgroundColor: t.inputBg,
        }}
      >
        <Tag color={t.muted} size={16} />
        <Txt style={{ flex: 1 }} muted={!selected} numberOfLines={1}>
          {selected?.name ?? tcat("noCategory")}
        </Txt>
        <ChevronDown color={t.muted} size={16} />
      </Pressable>

      {open ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 12,
            backgroundColor: t.card,
            padding: 8,
            gap: 8,
          }}
        >
          <Field
            value={query}
            onChangeText={setQuery}
            placeholder={tcat("searchPlaceholder")}
            autoFocus
            editable={!creating}
            returnKeyType="done"
            onSubmitEditing={() => {
              const first = rows[0];
              if (first) {
                void select(first);
              }
            }}
          />
          <ScrollView
            style={{ maxHeight: 220 }}
            keyboardShouldPersistTaps="handled"
          >
            {trimmedQuery !== "" && !hasCategoryRows ? (
              <Txt muted size={14} style={{ padding: 10 }}>
                {tcat("noResults")}
              </Txt>
            ) : null}
            {rows.map((row) => {
              const key =
                row.type === "category" ? `cat-${row.category._id}` : row.type;
              const isSelected =
                (row.type === "none" && value === null) ||
                (row.type === "category" && row.category._id === value);
              const label =
                row.type === "create"
                  ? tcat("createNamed", { name: row.name })
                  : row.type === "none"
                    ? tcat("noCategory")
                    : row.category.name;
              return (
                <Pressable
                  key={key}
                  onPress={() => void select(row)}
                  disabled={creating}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 12,
                    borderRadius: 8,
                    opacity: creating && row.type !== "create" ? 0.5 : 1,
                  }}
                >
                  {row.type === "create" ? (
                    creating ? (
                      <ActivityIndicator size="small" color={t.primary} />
                    ) : (
                      <Plus color={t.primary} size={16} />
                    )
                  ) : (
                    <Check
                      color={t.primary}
                      size={16}
                      style={{ opacity: isSelected ? 1 : 0 }}
                    />
                  )}
                  <Txt
                    size={15}
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: row.type === "create" ? t.primary : t.text,
                    }}
                  >
                    {label}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
