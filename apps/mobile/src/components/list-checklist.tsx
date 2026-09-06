import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { type RefObject, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DropProvider, Droppable } from "react-native-reanimated-dnd";
import { InlineAddItemRow, NewItemRow } from "@/components/inline-add-item";
import {
  EMPTY_TASK_DRAFT,
  type ItemTaskFields,
  taskDraftToArgs,
} from "@/components/task-fields";
import { DraggableItemRow, GhostDropSection } from "@/features/lists/item-rows";
import { ItemSheet, NewCategorySheet } from "@/features/lists/item-sheets";
import { groupByCategory } from "@/features/lists/sections";
import { ITEM_TRANSITION } from "@/features/lists/transitions";
import type { DragData, Item } from "@/features/lists/types";
import { useChecklistCommands } from "@/features/lists/use-checklist-commands";
import { useChecklistScroll } from "@/features/lists/use-checklist-scroll";
import { useItemEditor } from "@/features/lists/use-item-editor";
import { useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import { useOfflineListGet, usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { KeyboardAwareView, Loading, Txt } from "@/ui";

/**
 * Interactive checklist body: inline add, toggle, edit, categories, drag-and-drop.
 * Used by the list detail screen and embedded on event detail.
 */
export function ListChecklist({
  listId,
  embedded = false,
  scrollRef: externalScrollRef,
}: {
  listId: Id<"lists">;
  /** When true, renders inline without a ScrollView or list metadata blurb. */
  embedded?: boolean;
  /** Parent ScrollView ref for drag auto-scroll in embedded mode. */
  scrollRef?: RefObject<ScrollView | null>;
}) {
  const pid = useProjectId();
  const lid = listId;
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  const timeAgo = useTimeAgo();

  const list = useOfflineListGet(lid);
  const taskMode = true;
  const categories = usePersistentQuery(api.categories.listByProject, {
    projectId: pid,
  });
  const members = usePersistentQuery(api.projects.members, { projectId: pid });
  const memberById = useMemo(
    () => new Map((members ?? []).map((member) => [member._id, member])),
    [members],
  );
  const { createItem, updateItem, removeItem, setCompleted, setCategory } =
    useChecklistCommands(lid);

  // Editing happens in a drawer (`ItemSheet`); the target and drafts persist
  // while the sheet slides out so its content doesn't flicker during the close
  // animation. Creation is inline: `activeAddCategory` tracks which category
  // section's add row is expanded (undefined = none; null = the top
  // no-category row, which is always visible and only tracked here so a
  // categorized add collapses any open section row) and is set after each add
  // so focus follows the item into the category it went to.
  const [activeAddCategory, setActiveAddCategory] = useState<
    string | null | undefined
  >(undefined);
  const editor = useItemEditor({ updateItem, removeItem });
  const openEdit = editor.openEdit;

  // Drag-and-drop state.
  // drag runs; the reset key remounts every Draggable when a drop turns out to
  // be a no-op (same section, duplicate name, prompt pending) so rows never
  // linger mid-air. Successful moves re-section the item, which remounts it
  // anyway.
  const [draggingItem, setDraggingItem] = useState<Item | null>(null);
  const [dragResetKey, setDragResetKey] = useState(0);
  const [newCategorySheetOpen, setNewCategorySheetOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const pendingNewCategoryItem = useRef<Id<"listItems"> | null>(null);
  // Drop-zone coordinates go stale as the user scrolls; refresh them at a low
  // cadence plus once when scrolling settles.
  // Drives the ghost drop sections' fade/slide-in while a drag is active.
  const dragActive = useSharedValue(0);
  const ghostDropStyle = useAnimatedStyle(() => ({
    opacity: dragActive.value,
    transform: [{ translateY: (1 - dragActive.value) * 8 }],
  }));

  const {
    scrollRef,
    dropProviderRef,
    contentHeight,
    autoScrollComp,
    handleScroll,
    handleDragging,
    measureViewport,
    stopAutoScroll,
    refreshDropPositions,
  } = useChecklistScroll(embedded, externalScrollRef);

  const uncategorized = tl("uncategorized");
  const sections = useMemo(
    () => (list ? groupByCategory(list.items, uncategorized, true) : []),
    [list, uncategorized],
  );

  function toggle(item: Item) {
    void setCompleted({
      itemId: item._id,
      completed: !item.completed,
      expectedDueAt: item.dueAt ?? null,
    });
  }

  /**
   * Move an item to another section (or out of all of them). No-op drops
   * (same section, duplicate name in the target) reset the drag layer so the
   * row springs back instead of sticking to the drop slot; successful moves
   * re-section the item, which remounts it cleanly at its new spot.
   */
  function moveItem(itemId: Id<"listItems">, category: string | null) {
    const item = list?.items.find((candidate) => candidate._id === itemId);
    if (!list || !item) {
      setDragResetKey((key) => key + 1);
      return;
    }
    if ((item.category ?? null) === category) {
      setDragResetKey((key) => key + 1);
      return;
    }
    const duplicate = list.items.some(
      (candidate) =>
        (candidate.category ?? null) === category &&
        candidate.name === item.name,
    );
    if (duplicate) {
      setDragResetKey((key) => key + 1);
      Alert.alert(tl("itemAlreadyExistsInCategory"));
      return;
    }
    void setCategory({ itemId: item._id, category });
  }

  function handleNewCategoryDrop(itemId: Id<"listItems">) {
    pendingNewCategoryItem.current = itemId;
    setNewCategoryName("");
    // Send the row home right away — it shouldn't hover over the drop zone
    // while the name prompt is open.
    setDragResetKey((key) => key + 1);
    setNewCategorySheetOpen(true);
  }

  function submitNewCategory() {
    const itemId = pendingNewCategoryItem.current;
    const trimmed = newCategoryName.trim();
    pendingNewCategoryItem.current = null;
    setNewCategorySheetOpen(false);
    if (itemId === null || !trimmed) {
      return;
    }
    moveItem(itemId, trimmed);
  }

  function cancelNewCategory() {
    pendingNewCategoryItem.current = null;
    setNewCategorySheetOpen(false);
  }

  /**
   * Create an item from an inline add row. Returns false (keeping the row's
   * text) when a pending item with the same name already exists in the target
   * category; reopens a completed match instead of erroring. The mutation is
   * fire-and-forget: the optimistic update re-sections instantly, and awaiting
   * would blur the input and close the keyboard between consecutive adds.
   */
  function handleInlineAdd(
    name: string,
    category: string | null,
    task: ItemTaskFields = taskDraftToArgs(EMPTY_TASK_DRAFT),
  ): boolean {
    if (!list) {
      return false;
    }
    const matches = list.items.filter(
      (item) => (item.category ?? null) === category && item.name === name,
    );
    const pending = matches.find((item) => !item.completed);
    if (pending) {
      Alert.alert(tl("itemAlreadyExists"));
      return false;
    }
    const completed = matches.find((item) => item.completed);
    if (completed) {
      void setCompleted({
        itemId: completed._id,
        completed: false,
        expectedDueAt: completed.dueAt ?? null,
      });
      setActiveAddCategory(category);
      return true;
    }
    void createItem({ listId: lid, name, category, ...task });
    // Focus follows the item: the used category's row becomes (or stays) the
    // active one, ready for the next entry.
    setActiveAddCategory(category);
    return true;
  }

  /** Collapse an inline add row, unless focus already moved to another one. */
  function deactivateAddRow(category: string | null) {
    setActiveAddCategory((prev) => (prev === category ? undefined : prev));
  }

  if (list === undefined) {
    return embedded ? null : <Loading />;
  }

  if (list === null) {
    return null;
  }

  const checklistBody = (
    <>
      {!embedded ? (
        <View style={{ gap: 10, paddingBottom: 12 }}>
          {list.description ? (
            <Txt muted size={14} style={{ lineHeight: 20 }}>
              {list.description}
            </Txt>
          ) : null}
          <Txt muted size={11}>
            {tl("createdMeta", {
              name: list.createdByName ?? tc("someone"),
              date: timeAgo(list._creationTime),
            })}
            {list.updatedAt > list._creationTime
              ? ` · ${tl("updatedMeta", { date: timeAgo(list.updatedAt) })}`
              : ""}
          </Txt>
        </View>
      ) : null}

      <NewItemRow
        projectId={pid}
        categories={categories ?? []}
        onSubmit={handleInlineAdd}
      />

      {list.items.length === 0 ? (
        <Txt muted style={{ padding: embedded ? 8 : 16 }}>
          {tl("noItems")}
        </Txt>
      ) : null}

      {sections.map((section) => (
        <Animated.View
          key={
            section.category === null
              ? "uncategorized"
              : `category:${section.category}`
          }
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={ITEM_TRANSITION}
          style={
            draggingItem && (draggingItem.category ?? null) === section.category
              ? { zIndex: 10 }
              : undefined
          }
        >
          <Droppable<DragData>
            droppableId={
              section.category === null
                ? "uncategorized"
                : `category:${section.category}`
            }
            onDrop={(data) => moveItem(data.id, section.category)}
            style={{
              borderWidth: 1,
              borderStyle: "dashed",
              borderRadius: 12,
              paddingHorizontal: 6,
              marginHorizontal: embedded ? 0 : -6,
              borderColor:
                draggingItem &&
                (draggingItem.category ?? null) !== section.category
                  ? `${t.primary}80`
                  : "transparent",
            }}
            activeStyle={{
              backgroundColor: `${t.primary}14`,
              borderColor: t.primary,
            }}
          >
            {section.category !== null ? (
              <Txt
                muted
                size={12}
                style={{
                  paddingTop: 16,
                  paddingBottom: 4,
                  letterSpacing: 1,
                }}
              >
                {section.title.toUpperCase()}
              </Txt>
            ) : null}
            {section.data.map((item) => (
              <DraggableItemRow
                key={`${item._id}:${dragResetKey}`}
                item={item}
                taskMode={taskMode}
                memberById={memberById}
                autoScrollComp={autoScrollComp}
                onToggle={toggle}
                onEdit={openEdit}
              />
            ))}
            {section.category !== null ? (
              <InlineAddItemRow
                active={activeAddCategory === section.category}
                onActivate={() => setActiveAddCategory(section.category)}
                onDeactivate={() => deactivateAddRow(section.category)}
                onSubmit={(name) => handleInlineAdd(name, section.category)}
              />
            ) : null}
          </Droppable>
        </Animated.View>
      ))}

      {list.items.length > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[{ paddingTop: 14, gap: 10 }, ghostDropStyle]}
        >
          {sections.some((section) => section.category === null) ? null : (
            <GhostDropSection
              droppableId="drop-no-category"
              icon="none"
              label={tl("dropNoCategory")}
              onDrop={(data) => moveItem(data.id, null)}
            />
          )}
          <GhostDropSection
            droppableId="drop-new-category"
            icon="new"
            label={tl("dropNewCategory")}
            onDrop={(data) => handleNewCategoryDrop(data.id)}
          />
        </Animated.View>
      ) : null}
    </>
  );

  return (
    <DropProvider
      ref={dropProviderRef}
      onDragStart={(data: DragData) => {
        autoScrollComp.value = 0;
        measureViewport();
        dragActive.value = withTiming(1, { duration: 150 });
        setDraggingItem(
          list.items.find((item) => item._id === data.id) ?? null,
        );
      }}
      onDragging={handleDragging}
      onDragEnd={() => {
        stopAutoScroll();
        dragActive.value = withTiming(0, { duration: 200 });
        setDraggingItem(null);
      }}
    >
      {embedded ? (
        checklistBody
      ) : (
        <KeyboardAwareView>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 16 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollEndDrag={refreshDropPositions}
            onMomentumScrollEnd={refreshDropPositions}
            onContentSizeChange={(_w, h) => {
              contentHeight.current = h;
              refreshDropPositions();
            }}
            onLayout={() => {
              measureViewport();
              refreshDropPositions();
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {checklistBody}
          </ScrollView>
        </KeyboardAwareView>
      )}

      <ItemSheet
        {...editor}
        projectId={pid}
        taskMode={taskMode}
        categories={categories ?? []}
      />

      <NewCategorySheet
        visible={newCategorySheetOpen}
        name={newCategoryName}
        onChangeName={setNewCategoryName}
        onSubmit={submitNewCategory}
        onClose={cancelNewCategory}
      />
    </DropProvider>
  );
}
