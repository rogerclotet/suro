import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Check, ChevronDown, Plus, Tag, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Field, Txt } from "@/ui";

/** Autocomplete suggestion row (`_id` is only used as a stable list key). */
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
 * stacking modals. Values are plain category names; the "create" row just
 * selects the typed text (the suggestion is recorded server-side on save).
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: PickerCategory[];
  value: string | null;
  onChange: (category: string | null) => void;
}) {
  const t = useTheme();
  const tcat = useTranslations("mobile.categories");
  const tc = useTranslations("mobile.common");
  const deleteCategory = useMutation(api.categories.remove);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

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

  function select(row: Row) {
    onChange(
      row.type === "none"
        ? null
        : row.type === "category"
          ? row.category.name
          : row.name,
    );
    close();
  }

  function confirmDelete(category: PickerCategory) {
    Alert.alert(
      tcat("deleteSuggestion"),
      tcat("deleteSuggestionMessage", { name: category.name }),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tc("delete"),
          style: "destructive",
          onPress: () => {
            void deleteCategory({ categoryId: category._id });
          },
        },
      ],
    );
  }

  const selected = value !== null;
  return (
    <View style={{ gap: 8 }}>
      {/* A compact pill, not a full-width input box: it reads as an optional tag
          attached to the item rather than a second primary field next to the
          name. Self-sized (alignSelf), so the expanded panel below still spans
          the full width. */}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          maxWidth: "100%",
          gap: 6,
          borderWidth: 1,
          borderColor: selected ? t.primary : t.border,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: selected ? `${t.primary}1a` : "transparent",
        }}
      >
        <Tag color={selected ? t.primary : t.muted} size={14} />
        <Txt
          size={14}
          muted={!selected}
          numberOfLines={1}
          style={{ flexShrink: 1, ...(selected ? { color: t.primary } : null) }}
        >
          {value ?? tcat("noCategory")}
        </Txt>
        <ChevronDown color={selected ? t.primary : t.muted} size={14} />
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
            returnKeyType="done"
            onSubmitEditing={() => {
              const first = rows[0];
              if (first) {
                select(first);
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
                (row.type === "category" && row.category.name === value);
              const label =
                row.type === "create"
                  ? tcat("createNamed", { name: row.name })
                  : row.type === "none"
                    ? tcat("noCategory")
                    : row.category.name;
              return (
                <Pressable
                  key={key}
                  onPress={() => select(row)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}
                >
                  {row.type === "create" ? (
                    <Plus color={t.primary} size={16} />
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
                  {row.type === "category" ? (
                    <Pressable
                      onPress={() => confirmDelete(row.category)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={tcat("deleteSuggestion")}
                      style={({ pressed }) => ({
                        padding: 4,
                        opacity: pressed ? 0.5 : 1,
                      })}
                    >
                      <Trash2 color={t.muted} size={16} />
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
