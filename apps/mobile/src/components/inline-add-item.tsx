import { Plus } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, type TextInput, View } from "react-native";
import {
  CategoryPicker,
  type PickerCategory,
} from "@/components/category-picker";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Field, Txt } from "@/ui";

/**
 * Inline "add item" row at the bottom of a category section: a muted ghost row
 * that expands into a focused input on tap. Items go to the row's own section;
 * only the bottom no-category row carries a quick category selector
 * (`withCategoryPicker`) to redirect the new item anywhere.
 */
export function InlineAddItemRow({
  active,
  withCategoryPicker,
  categories = [],
  onActivate,
  onDeactivate,
  onSubmit,
}: {
  active: boolean;
  /** Bottom no-category row only. */
  withCategoryPicker?: boolean;
  categories?: PickerCategory[];
  onActivate: () => void;
  onDeactivate: () => void;
  /** Returns false when blocked (duplicate name); the typed text is kept. */
  onSubmit: (name: string, category: string | null) => boolean;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");

  if (!active) {
    return (
      <Pressable
        onPress={onActivate}
        accessibilityRole="button"
        accessibilityLabel={tl("addItem")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
        }}
      >
        <Plus color={t.muted} size={18} />
        <Txt muted size={15}>
          {tl("addItem")}
        </Txt>
      </Pressable>
    );
  }

  return (
    <ActiveAddItemRow
      withCategoryPicker={withCategoryPicker}
      categories={categories}
      onDeactivate={onDeactivate}
      onSubmit={onSubmit}
    />
  );
}

/** The expanded input; separate so its draft state mounts fresh per activation. */
function ActiveAddItemRow({
  withCategoryPicker,
  categories,
  onDeactivate,
  onSubmit,
}: {
  withCategoryPicker?: boolean;
  categories: PickerCategory[];
  onDeactivate: () => void;
  onSubmit: (name: string, category: string | null) => boolean;
}) {
  const tl = useTranslations("mobile.lists");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  // The picker's inline search panel autofocuses, blurring the name field
  // without the user abandoning the row; skip the blur-collapse while open.
  const [pickerOpen, setPickerOpen] = useState(false);
  const nameRef = useRef<TextInput>(null);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      onDeactivate();
      return;
    }
    if (!onSubmit(trimmed, category)) {
      return; // duplicate: keep the text for editing
    }
    // Clear synchronously; the parent fires the mutation without awaiting, so
    // focus (and the keyboard) survives into the next add.
    setName("");
    setCategory(null);
  }

  function handleBlur() {
    if (!pickerOpen && name.trim() === "") {
      onDeactivate();
    }
  }

  return (
    <View style={{ gap: 8, paddingVertical: 8 }}>
      <Field
        ref={nameRef}
        value={name}
        onChangeText={setName}
        placeholder={tl("addItemPlaceholder")}
        autoFocus
        returnKeyType="done"
        // Keep focus through the submit so consecutive adds don't bounce the
        // keyboard (RN 0.85 replacement for blurOnSubmit={false}).
        submitBehavior="submit"
        onSubmitEditing={handleSubmit}
        onBlur={handleBlur}
      />
      {withCategoryPicker ? (
        <CategoryPicker
          categories={categories}
          value={category}
          onChange={(next) => {
            setCategory(next);
            // Hand focus back to the name input once a category is picked.
            nameRef.current?.focus();
          }}
          onOpenChange={setPickerOpen}
        />
      ) : null}
    </View>
  );
}
