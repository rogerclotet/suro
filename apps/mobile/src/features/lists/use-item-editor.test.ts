// @vitest-environment jsdom
import type { Id } from "backend/convex/_generated/dataModel";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Item } from "./types";
import type { useChecklistCommands } from "./use-checklist-commands";
import { useItemEditor } from "./use-item-editor";

const boundary = vi.hoisted(() => ({ alert: vi.fn(), capture: vi.fn() }));
vi.mock("react-native", () => ({ Alert: { alert: boundary.alert } }));
vi.mock("posthog-react-native", () => ({
  usePostHog: () => ({ captureException: boundary.capture }),
}));
vi.mock("@/i18n", () => ({ useTranslations: () => (key: string) => key }));
// The native task controls aren't rendered by this hook test.
vi.mock("@/components/task-fields", () => ({
  EMPTY_TASK_DRAFT: {},
  taskDraftFromItem: () => ({}),
  taskDraftToArgs: () => ({}),
}));

const updateItem =
  vi.fn<ReturnType<typeof useChecklistCommands>["updateItem"]>();
const removeItem =
  vi.fn<ReturnType<typeof useChecklistCommands>["removeItem"]>();
const item: Item = {
  _id: "item" as Id<"listItems">,
  _creationTime: 1,
  listId: "list" as Id<"lists">,
  createdBy: "user" as Id<"users">,
  updatedAt: 1,
  name: "Original",
  completed: false,
};
let root: Root;
let editor: ReturnType<typeof useItemEditor>;
function Probe() {
  editor = useItemEditor({ updateItem, removeItem });
  return null;
}
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  updateItem.mockReset();
  removeItem.mockReset();
  root = createRoot(document.createElement("div"));
  await act(async () => root.render(createElement(Probe)));
  await act(async () => editor.openEdit(item));
  await act(async () => {
    editor.onChangeName("Unsaved name");
    editor.onChangeDetails("Unsaved details");
    editor.onChangeCategory("Kitchen");
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

it("handles a rejected save, preserves the draft, and allows a successful retry", async () => {
  const error = new Error("Server Error");
  updateItem.mockRejectedValueOnce(error);
  await act(async () => {
    await expect(editor.onSubmit()).resolves.toBeUndefined();
  });
  expect(editor.visible).toBe(true);
  expect(editor.name).toBe("Unsaved name");
  expect(editor.details).toBe("Unsaved details");
  expect(editor.category).toBe("Kitchen");
  expect(boundary.alert).toHaveBeenCalledWith("itemUpdateError");
  expect(boundary.capture).toHaveBeenCalledWith(error, {
    action: "update_list_item",
    listId: item.listId,
    itemId: item._id,
  });
  updateItem.mockResolvedValueOnce({ kind: "synced", value: null });
  await act(async () => editor.onSubmit());
  expect(editor.visible).toBe(false);
  expect(updateItem).toHaveBeenLastCalledWith(
    expect.objectContaining({
      name: "Unsaved name",
      details: "Unsaved details",
      category: "Kitchen",
    }),
  );
});

it("keeps pending saves open and prevents duplicate saves and deletes", async () => {
  const pending =
    Promise.withResolvers<Awaited<ReturnType<typeof updateItem>>>();
  updateItem.mockReturnValue(pending.promise);
  const submissions: Promise<void>[] = [];
  await act(async () => {
    submissions.push(editor.onSubmit(), editor.onSubmit(), editor.onDelete());
    editor.onClose();
  });
  expect(editor.visible).toBe(true);
  expect(updateItem).toHaveBeenCalledTimes(1);
  expect(removeItem).not.toHaveBeenCalled();
  await act(async () => {
    pending.resolve({ kind: "synced", value: null });
    await Promise.all(submissions);
  });
  expect(editor.visible).toBe(false);
});

it("closes once an offline edit has been accepted into the queue", async () => {
  updateItem.mockResolvedValueOnce({ kind: "queued", localId: null });
  await act(async () => editor.onSubmit());
  expect(editor.visible).toBe(false);
  expect(boundary.alert).not.toHaveBeenCalled();
});

it("handles a rejected delete without dismissing the editor", async () => {
  const error = new Error("Server Error");
  removeItem.mockRejectedValueOnce(error);
  await act(async () => {
    await expect(editor.onDelete()).resolves.toBeUndefined();
  });
  expect(editor.visible).toBe(true);
  expect(boundary.alert).toHaveBeenCalledWith("deleteItemError");
  expect(boundary.capture).toHaveBeenCalledWith(error, {
    action: "delete_list_item",
    listId: item.listId,
    itemId: item._id,
  });
});
