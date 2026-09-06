import { useState } from "react";
import {
  EMPTY_TASK_DRAFT,
  type TaskDraft,
  taskDraftFromItem,
  taskDraftToArgs,
} from "@/components/task-fields";
import type { Item } from "./types";
import type { useChecklistCommands } from "./use-checklist-commands";

export function useItemEditor({
  updateItem,
  removeItem,
}: Pick<ReturnType<typeof useChecklistCommands>, "updateItem" | "removeItem">) {
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDetails, setDraftDetails] = useState("");
  const [draftCategory, setDraftCategory] = useState<string | null>(null);
  // Task metadata for the item sheet; only surfaced/sent when the list is in
  // task mode. Seeded from the edited item, reset for a plain edit.
  const [draftTask, setDraftTask] = useState<TaskDraft>(EMPTY_TASK_DRAFT);

  function openEdit(item: Item) {
    setEditingItem(item);
    setDraftName(item.name);
    setDraftDetails(item.details ?? "");
    setDraftCategory(item.category ?? null);
    setDraftTask(taskDraftFromItem(item));
    setItemSheetOpen(true);
  }

  async function submitItem() {
    if (!editingItem) {
      return;
    }
    const target = editingItem;
    setItemSheetOpen(false);
    await updateItem({
      itemId: target._id,
      name: draftName.trim() || target.name,
      details: draftDetails,
      completed: target.completed,
      category: draftCategory,
      // Task lists send the edited metadata; plain lists send the item's current
      // fields untouched (which for a checklist are all undefined).
      ...taskDraftToArgs(draftTask),
    });
  }

  async function deleteCurrentItem() {
    if (!editingItem) {
      return;
    }
    const target = editingItem;
    setItemSheetOpen(false);
    await removeItem({ itemId: target._id });
  }

  return {
    openEdit,
    visible: itemSheetOpen,
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
    onClose: () => setItemSheetOpen(false),
  };
}
