import { useRef, useState } from "react";
import { Alert } from "react-native";
import {
  EMPTY_TASK_DRAFT,
  type TaskDraft,
  taskDraftFromItem,
  taskDraftToArgs,
} from "@/components/task-fields";
import { useTranslations } from "@/i18n";
import { captureException } from "@/lib/error-reporting";
import type { Item } from "./types";
import type { useChecklistCommands } from "./use-checklist-commands";

export function useItemEditor({
  updateItem,
  removeItem,
}: Pick<ReturnType<typeof useChecklistCommands>, "updateItem" | "removeItem">) {
  const t = useTranslations("lists");
  const pending = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDetails, setDraftDetails] = useState("");
  const [draftCategory, setDraftCategory] = useState<string | null>(null);
  // Task metadata for the item sheet; only surfaced/sent when the list is in
  // task mode. Seeded from the edited item, reset for a plain edit.
  const [draftTask, setDraftTask] = useState<TaskDraft>(EMPTY_TASK_DRAFT);

  function openEdit(item: Item) {
    if (pending.current) return;
    setEditingItem(item);
    setDraftName(item.name);
    setDraftDetails(item.details ?? "");
    setDraftCategory(item.category ?? null);
    setDraftTask(taskDraftFromItem(item));
    setItemSheetOpen(true);
  }

  async function submitItem() {
    if (!editingItem || pending.current) {
      return;
    }
    const target = editingItem;
    pending.current = true;
    setSubmitting(true);
    try {
      await updateItem({
        itemId: target._id,
        name: draftName.trim() || target.name,
        details: draftDetails,
        completed: target.completed,
        category: draftCategory,
        ...taskDraftToArgs(draftTask),
      });
      setItemSheetOpen(false);
    } catch (error) {
      Alert.alert(t("itemUpdateError"));
      reportError(error, "update_list_item");
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  async function deleteCurrentItem() {
    if (!editingItem || pending.current) {
      return;
    }
    const target = editingItem;
    pending.current = true;
    setSubmitting(true);
    try {
      await removeItem({ itemId: target._id });
      setItemSheetOpen(false);
    } catch (error) {
      Alert.alert(t("deleteItemError"));
      reportError(error, "delete_list_item");
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  function reportError(
    error: unknown,
    action: "update_list_item" | "delete_list_item",
  ) {
    try {
      captureException(error, {
        action,
      });
    } catch {
      // Reporting must not prevent retrying the preserved draft.
    }
  }

  return {
    openEdit,
    visible: itemSheetOpen,
    submitting,
    name: draftName,
    details: draftDetails,
    category: draftCategory,
    task: draftTask,
    onChangeName: setDraftName,
    onChangeDetails: setDraftDetails,
    onChangeCategory: setDraftCategory,
    onChangeTask: setDraftTask,
    onSubmit: submitItem,
    onDelete: deleteCurrentItem,
    onClose: () => {
      if (!pending.current) setItemSheetOpen(false);
    },
  };
}
