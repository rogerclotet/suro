import type { Id } from "backend/convex/_generated/dataModel";
import { Dimensions, Pressable, ScrollView } from "react-native";
import { CategoryPicker } from "@/components/category-picker";
import { type TaskDraft, TaskFieldsEditor } from "@/components/task-fields";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Button, Field, Sheet, Txt } from "@/ui";
import type { Category } from "./types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

/** Prompt for the name when an item is dropped on the "new category" zone. */
export function NewCategorySheet({
  visible,
  name,
  onChangeName,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  name: string;
  onChangeName: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tl("newCategoryTitle")}
      </Txt>
      <Field
        placeholder={tl("newCategoryPlaceholder")}
        value={name}
        onChangeText={onChangeName}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      <Button title={tc("save")} onPress={onSubmit} />
    </Sheet>
  );
}

// Edit drawer for a list item. Creation is inline (the per-section add rows);
// this remains the surface for renaming, details, re-categorizing and delete.
export function ItemSheet({
  visible,
  projectId,
  taskMode: _taskMode,
  name,
  details,
  category,
  categories,
  task,
  onChangeName,
  onChangeDetails,
  onChangeCategory,
  onChangeTask,
  onSubmit,
  onDelete,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  taskMode: boolean;
  name: string;
  details: string;
  category: string | null;
  categories: Category[];
  task: TaskDraft;
  onChangeName: (value: string) => void;
  onChangeDetails: (value: string) => void;
  onChangeCategory: (value: string | null) => void;
  onChangeTask: (task: TaskDraft) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // A task editor is much taller than a checklist's; cap it so a long form
        // scrolls inside the sheet instead of pushing the save button off-screen.
        style={{ maxHeight: SCREEN_HEIGHT * 0.66 }}
        contentContainerStyle={{ gap: 12 }}
      >
        <Txt size={18} weight="700">
          {tl("editItem")}
        </Txt>
        <Field
          placeholder={tl("namePlaceholder")}
          value={name}
          onChangeText={onChangeName}
        />
        <Field
          placeholder={tl("detailsPlaceholder")}
          value={details}
          onChangeText={onChangeDetails}
          multiline
          textAlignVertical="top"
          style={{ minHeight: 88, paddingTop: 11 }}
        />
        <TaskFieldsEditor
          projectId={projectId}
          draft={task}
          onChange={onChangeTask}
        />
        <CategoryPicker
          categories={categories}
          value={category}
          onChange={onChangeCategory}
        />
        <Button title={tc("save")} onPress={onSubmit} />
        <Pressable onPress={onDelete} style={{ padding: 10 }}>
          <Txt style={{ textAlign: "center", color: t.danger }}>
            {tl("deleteItem")}
          </Txt>
        </Pressable>
      </ScrollView>
    </Sheet>
  );
}
