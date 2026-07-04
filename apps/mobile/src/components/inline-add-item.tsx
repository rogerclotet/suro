import type { Id } from "backend/convex/_generated/dataModel";
import { Check, Plus } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, type TextInput, View } from "react-native";
import type { PickerCategory } from "@/components/category-picker";
import {
  EMPTY_TASK_DRAFT,
  type ItemTaskFields,
  NewItemTaskControls,
  type TaskDraft,
  taskDraftToArgs,
} from "@/components/task-fields";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Field, Txt } from "@/ui";

/**
 * Confirm button sitting right of an add row's input, for users who don't
 * reach for the keyboard's return key. Sized to match `Field`'s height.
 */
function SubmitItemButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const tc = useTranslations("mobile.common");
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={tc("add")}
      style={{
        width: 44,
        borderRadius: 12,
        backgroundColor: disabled ? t.inputBg : t.primary,
        borderWidth: 1,
        borderColor: disabled ? t.border : t.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Check color={disabled ? t.muted : t.onPrimary} size={20} />
    </Pressable>
  );
}

/**
 * The list's always-visible add row at the top: a name input plus property chips
 * (category, due date, assignee, priority, repeat). Submits keep focus so
 * consecutive adds don't bounce the keyboard; the parent hands focus to a
 * category's inline row when one is picked.
 */
export function NewItemRow({
  projectId,
  categories,
  onSubmit,
}: {
  projectId: Id<"projects">;
  categories: PickerCategory[];
  /** Returns false when blocked (duplicate name); the typed text is kept. */
  onSubmit: (
    name: string,
    category: string | null,
    task: ItemTaskFields,
  ) => boolean;
}) {
  const tl = useTranslations("mobile.lists");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [task, setTask] = useState<TaskDraft>(EMPTY_TASK_DRAFT);
  const nameRef = useRef<TextInput>(null);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    if (!onSubmit(trimmed, category, taskDraftToArgs(task))) {
      return; // duplicate: keep the text for editing
    }
    // Clear synchronously; the parent fires the mutation without awaiting, so
    // focus (and the keyboard) survives into the next add.
    setName("");
    setCategory(null);
    setTask(EMPTY_TASK_DRAFT);
  }

  return (
    <View style={{ gap: 8, paddingBottom: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Field
          ref={nameRef}
          value={name}
          onChangeText={setName}
          placeholder={tl("addItemPlaceholder")}
          returnKeyType="done"
          // Keep focus through the submit so consecutive adds don't bounce the
          // keyboard (RN 0.85 replacement for blurOnSubmit={false}).
          submitBehavior="submit"
          onSubmitEditing={handleSubmit}
          style={{ flex: 1 }}
        />
        <SubmitItemButton
          disabled={name.trim() === ""}
          onPress={handleSubmit}
        />
      </View>
      <NewItemTaskControls
        projectId={projectId}
        draft={task}
        onChange={setTask}
        categories={categories}
        category={category}
        onChangeCategory={setCategory}
        onCategorySelected={() => nameRef.current?.focus()}
      />
    </View>
  );
}

/**
 * Inline "add item" row at the bottom of a category section: a muted ghost row
 * that expands into a focused input on tap. Items go to the row's own section;
 * the no-category entry point is the always-visible `NewItemRow` at the top.
 */
export function InlineAddItemRow({
  active,
  onActivate,
  onDeactivate,
  onSubmit,
}: {
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  /** Returns false when blocked (duplicate name); the typed text is kept. */
  onSubmit: (name: string) => boolean;
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

  return <ActiveAddItemRow onDeactivate={onDeactivate} onSubmit={onSubmit} />;
}

/** The expanded input; separate so its draft state mounts fresh per activation. */
function ActiveAddItemRow({
  onDeactivate,
  onSubmit,
}: {
  onDeactivate: () => void;
  onSubmit: (name: string) => boolean;
}) {
  const tl = useTranslations("mobile.lists");
  const [name, setName] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      onDeactivate();
      return;
    }
    if (!onSubmit(trimmed)) {
      return; // duplicate: keep the text for editing
    }
    // Clear synchronously; the parent fires the mutation without awaiting, so
    // focus (and the keyboard) survives into the next add.
    setName("");
  }

  function handleBlur() {
    if (name.trim() === "") {
      onDeactivate();
    }
  }

  return (
    <View style={{ flexDirection: "row", gap: 8, paddingVertical: 8 }}>
      <Field
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
        style={{ flex: 1 }}
      />
      <SubmitItemButton disabled={name.trim() === ""} onPress={handleSubmit} />
    </View>
  );
}
