import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import {
  CalendarClock,
  Check,
  Flag,
  GripVertical,
  Plus,
  Repeat,
  Tag,
} from "lucide-react-native";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import {
  Draggable,
  DraggableState,
  DropProvider,
  type DropProviderRef,
  Droppable,
} from "react-native-reanimated-dnd";
import { Avatar } from "@/components/avatar";
import { CategoryPicker } from "@/components/category-picker";
import { InlineAddItemRow, NewItemRow } from "@/components/inline-add-item";
import {
  EMPTY_TASK_DRAFT,
  type ItemTaskFields,
  priorityColor,
  type TaskDraft,
  TaskFieldsEditor,
  taskDraftFromItem,
  taskDraftToArgs,
  useFormatDue,
} from "@/components/task-fields";
import { useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import {
  useOfflineListGet,
  usePersistentQuery,
  useQueuedMutation,
} from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { advanceDueAt, presetForRecurrence } from "@/lib/recurrence";
import { compareTaskItems } from "@/lib/task-order";
import { useTheme } from "@/theme";
import { Button, Field, Loading, Sheet, Txt } from "@/ui";

type ListResult = NonNullable<FunctionReturnType<typeof api.lists.get>>;
type Item = ListResult["items"][number];
type Category = FunctionReturnType<typeof api.categories.listByProject>[number];
type Member = FunctionReturnType<typeof api.projects.members>[number];
type MemberById = Map<Id<"users">, Member>;
/** Payload carried by a dragged item row into the drop zones. */
type DragData = { id: Id<"listItems"> };

type Section = { title: string; category: string | null; data: Item[] };

const SCREEN_HEIGHT = Dimensions.get("window").height;

// Module-level counter for optimistic item ids (Hermes has no crypto.randomUUID).
let optimisticItemCounter = 0;
function nextOptimisticItemId(): Id<"listItems"> {
  optimisticItemCounter += 1;
  return `optimistic-item-${optimisticItemCounter}` as Id<"listItems">;
}

/**
 * A gentle, barely-underdamped spring shared by rows and sections so items
 * glide to their new positions instead of snapping along a robotic linear
 * path. Reused as a config descriptor across every animated row/section.
 */
const ITEM_TRANSITION = LinearTransition.springify()
  .damping(24)
  .stiffness(220)
  .mass(0.9);

// Auto-scroll while a dragged row nears a screen edge, so categories above or
// below the fold come into reach. The zone is the band (in px) inside each
// viewport edge that arms scrolling; speed ramps from MIN at the band's inner
// boundary to MAX at the edge itself, both in px per animation frame. The inset
// approximates half a row so the row's center — not its top — drives detection.
const AUTO_SCROLL_EDGE = 90;
const AUTO_SCROLL_MIN_SPEED = 3;
const AUTO_SCROLL_MAX_SPEED = 18;
const DRAG_POINT_INSET = 24;

/** px/frame to auto-scroll given how far the row pushed past a zone boundary. */
function edgeAutoScrollSpeed(penetration: number): number {
  const ratio = Math.min(1, Math.max(0, penetration) / AUTO_SCROLL_EDGE);
  return (
    AUTO_SCROLL_MIN_SPEED +
    ratio * (AUTO_SCROLL_MAX_SPEED - AUTO_SCROLL_MIN_SPEED)
  );
}

/**
 * Mirrors the backend's item ordering (completed last, then by name, then id)
 * so the client sorts the same way the server does. Applying it client-side
 * means an optimistic toggle or drop re-sorts in the very commit the user
 * acts in — the row slides straight to its sorted spot under `ITEM_TRANSITION`
 * instead of sitting still and then jumping when the server's re-sorted list
 * arrives a round-trip later.
 */
function compareItems(a: Item, b: Item): number {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }
  const byName = a.name.localeCompare(b.name);
  return byName !== 0 ? byName : a._id.localeCompare(b._id);
}

/**
 * The item's current task fields, in the shape `listItems.update` expects. Every
 * `updateItem` call (toggle, drag-recategorize, edit save) must forward these:
 * the mutation is non-sticky, so any omitted task field is wiped server-side.
 */
function itemTaskArgs(
  item: Item,
): Pick<
  Item,
  "dueAt" | "dueAllDay" | "assigneeId" | "priority" | "recurrence"
> {
  return {
    dueAt: item.dueAt,
    dueAllDay: item.dueAllDay,
    assigneeId: item.assigneeId,
    priority: item.priority,
    recurrence: item.recurrence,
  };
}

function groupByCategory(
  items: Item[],
  uncategorized: string,
  taskMode: boolean,
): Section[] {
  // Task lists order each section by due date/priority (matching the backend and
  // the "My tasks" agenda); plain checklists keep the name-only order.
  const compare = taskMode ? compareTaskItems<Item> : compareItems;
  const groups = new Map<string, Section>();
  for (const item of [...items].sort(compare)) {
    const category = item.category ?? null;
    const title = category ?? uncategorized;
    const bucket = groups.get(title);
    if (bucket) {
      bucket.data.push(item);
    } else {
      groups.set(title, { title, category, data: [item] });
    }
  }
  // The uncategorized bucket always sorts first so its items sit right below
  // the always-visible add row at the top (the no-category entry point).
  return [...groups.values()].sort((a, b) => {
    if (a.category === null) return -1;
    if (b.category === null) return 1;
    return a.title.localeCompare(b.title);
  });
}

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
  // Optimistic so the new row (and a brand-new category section) mounts in the
  // same commit as the focus-follow state change — the inline input can grab
  // focus without waiting a server round-trip or bouncing the keyboard.
  const createItem = useQueuedMutation(api.listItems.create, (store, args) => {
    const current = store.getQuery(api.lists.get, { listId: lid });
    if (!current) {
      return;
    }
    store.setQuery(
      api.lists.get,
      { listId: lid },
      {
        ...current,
        items: [
          ...current.items,
          {
            // Placeholder identity; Convex swaps in the server row on
            // completion. `createdBy` isn't rendered, so the list's creator
            // stands in for the current user.
            _id: nextOptimisticItemId(),
            _creationTime: Date.now(),
            name: args.name,
            completed: false,
            listId: lid,
            category: args.category ?? undefined,
            createdBy: current.createdBy,
            updatedAt: Date.now(),
            // Carry any task fields so a created task sorts/renders correctly
            // before the server row arrives. (Quick inline-add sends none.)
            dueAt: args.dueAt,
            dueAllDay: args.dueAllDay,
            assigneeId: args.assigneeId,
            priority: args.priority,
            recurrence: args.recurrence,
          },
        ],
      },
    );
  });
  const removeItem = useQueuedMutation(api.listItems.remove);
  // Optimistic so checkbox toggles and drag-drops re-section instantly instead
  // of waiting a server round-trip.
  const updateItem = useQueuedMutation(api.listItems.update, (store, args) => {
    const current = store.getQuery(api.lists.get, { listId: lid });
    if (!current) {
      return;
    }
    const now = Date.now();
    store.setQuery(
      api.lists.get,
      { listId: lid },
      {
        ...current,
        items: current.items.map((item) => {
          if (item._id !== args.itemId) {
            return item;
          }
          // Mirror the server (and the offline overlay): checking off a still-open
          // recurring task advances its due date and keeps it open instead of
          // completing. All task fields ride along so an omitted field clears.
          const recurrence = args.recurrence;
          const reschedule =
            recurrence !== undefined && args.completed && !item.completed;
          return {
            ...item,
            name: args.name,
            details: args.details?.trim() || undefined,
            completed: reschedule ? false : args.completed,
            category: args.category?.trim() || undefined,
            dueAt:
              reschedule && recurrence !== undefined
                ? advanceDueAt(args.dueAt ?? now, recurrence, now)
                : args.dueAt,
            dueAllDay: args.dueAllDay,
            assigneeId: args.assigneeId,
            priority: args.priority,
            recurrence: args.recurrence,
          };
        }),
      },
    );
  });

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
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDetails, setDraftDetails] = useState("");
  const [draftCategory, setDraftCategory] = useState<string | null>(null);
  // Task metadata for the item sheet; only surfaced/sent when the list is in
  // task mode. Seeded from the edited item, reset for a plain edit.
  const [draftTask, setDraftTask] = useState<TaskDraft>(EMPTY_TASK_DRAFT);

  // Drag-and-drop state.
  // drag runs; the reset key remounts every Draggable when a drop turns out to
  // be a no-op (same section, duplicate name, prompt pending) so rows never
  // linger mid-air. Successful moves re-section the item, which remounts it
  // anyway.
  const dropProviderRef = useRef<DropProviderRef>(null);
  const [draggingItem, setDraggingItem] = useState<Item | null>(null);
  const [dragResetKey, setDragResetKey] = useState(0);
  const [newCategorySheetOpen, setNewCategorySheetOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const pendingNewCategoryItem = useRef<Id<"listItems"> | null>(null);
  // Drop-zone coordinates go stale as the user scrolls; refresh them at a low
  // cadence plus once when scrolling settles.
  const lastPositionUpdate = useRef(0);
  // Drives the ghost drop sections' fade/slide-in while a drag is active.
  const dragActive = useSharedValue(0);
  const ghostDropStyle = useAnimatedStyle(() => ({
    opacity: dragActive.value,
    transform: [{ translateY: (1 - dragActive.value) * 8 }],
  }));

  // Auto-scroll while dragging toward a screen edge. `onDragging` reports the
  // lifted row's window position; once it enters an edge zone a rAF loop nudges
  // the ScrollView. Because the row lives inside that ScrollView, the loop also
  // feeds `autoScrollComp` an equal counter-translation so the row stays pinned
  // under the finger instead of sliding off with the content — and so the drop,
  // which the dnd library resolves from the row's frozen drag origin, lands
  // where the row visually sits. `scrollOffset`/`contentHeight`/the viewport
  // rect are the bookkeeping the loop needs to clamp and place each step.
  const ownScrollRef = useRef<ScrollView>(null);
  const scrollRef =
    embedded && externalScrollRef ? externalScrollRef : ownScrollRef;
  const scrollOffset = useRef(0);
  const contentHeight = useRef(0);
  const viewportTop = useRef(0);
  const viewportHeight = useRef(0);
  const autoScrollDir = useRef<-1 | 0 | 1>(0);
  const autoScrollSpeed = useRef(0);
  const autoScrollFrame = useRef<number | null>(null);
  const autoScrollComp = useSharedValue(0);

  // Cancel an in-flight auto-scroll loop if the screen unmounts mid-drag.
  useEffect(() => {
    return () => {
      if (autoScrollFrame.current !== null) {
        cancelAnimationFrame(autoScrollFrame.current);
      }
    };
  }, []);

  const uncategorized = tl("uncategorized");
  const sections = useMemo(
    () => (list ? groupByCategory(list.items, uncategorized, true) : []),
    [list, uncategorized],
  );

  function toggle(item: Item) {
    void updateItem({
      itemId: item._id,
      name: item.name,
      details: item.details ?? "",
      completed: !item.completed,
      category: item.category ?? null,
      // The update mutation clears any omitted task field, so a checkbox toggle
      // must forward the item's current ones (and recurrence drives the
      // reschedule-on-complete on a recurring task).
      ...itemTaskArgs(item),
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
    void updateItem({
      itemId: item._id,
      name: item.name,
      details: item.details ?? "",
      completed: item.completed,
      category,
      // Re-categorizing must preserve the item's task fields (omitted = cleared).
      ...itemTaskArgs(item),
    });
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

  function refreshDropPositions() {
    dropProviderRef.current?.requestPositionUpdate();
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    // Track the resting offset so auto-scroll has an accurate base to build on.
    scrollOffset.current = e.nativeEvent.contentOffset.y;
    const now = Date.now();
    if (now - lastPositionUpdate.current > 100) {
      lastPositionUpdate.current = now;
      refreshDropPositions();
    }
  }

  // Capture the scroll viewport's window rect (it sits below the navigation
  // header) so edge detection can compare the dragged row's window position
  // against the visible area. Re-measured on layout and at each drag start.
  function measureViewport() {
    scrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, y, _w, h) => {
      viewportTop.current = y;
      viewportHeight.current = h;
    });
  }

  function stopAutoScroll() {
    if (autoScrollFrame.current !== null) {
      cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = null;
    }
    autoScrollDir.current = 0;
    autoScrollSpeed.current = 0;
  }

  function autoScrollStep() {
    const dir = autoScrollDir.current;
    if (dir === 0) {
      autoScrollFrame.current = null;
      return;
    }
    const maxOffset = Math.max(
      0,
      contentHeight.current - viewportHeight.current,
    );
    const next = Math.min(
      maxOffset,
      Math.max(0, scrollOffset.current + dir * autoScrollSpeed.current),
    );
    const delta = next - scrollOffset.current;
    // Reached the top or bottom of the content: idle until the finger moves
    // again (the next onDragging restarts the loop).
    if (delta === 0) {
      autoScrollFrame.current = null;
      return;
    }
    scrollOffset.current = next;
    scrollRef.current?.scrollTo({ y: next, animated: false });
    // Keep the lifted row under the finger, and refresh the drop zones that
    // just moved with the page so the hovered target and the release resolve
    // against where the categories are now.
    autoScrollComp.value += delta;
    refreshDropPositions();
    autoScrollFrame.current = requestAnimationFrame(autoScrollStep);
  }

  // Called continuously while a row is dragged. Picks an auto-scroll direction
  // and speed from how far the row's center has pushed into an edge zone, then
  // makes sure the loop is running.
  function handleDragging({ y, ty }: { y: number; ty: number }) {
    if (viewportHeight.current === 0) {
      return;
    }
    const center = y + ty + DRAG_POINT_INSET;
    const topZone = viewportTop.current + AUTO_SCROLL_EDGE;
    const bottomZone =
      viewportTop.current + viewportHeight.current - AUTO_SCROLL_EDGE;
    if (center < topZone) {
      autoScrollDir.current = -1;
      autoScrollSpeed.current = edgeAutoScrollSpeed(topZone - center);
    } else if (center > bottomZone) {
      autoScrollDir.current = 1;
      autoScrollSpeed.current = edgeAutoScrollSpeed(center - bottomZone);
    } else {
      autoScrollDir.current = 0;
      autoScrollSpeed.current = 0;
    }
    if (autoScrollDir.current !== 0 && autoScrollFrame.current === null) {
      autoScrollFrame.current = requestAnimationFrame(autoScrollStep);
    }
  }

  /**
   * Create an item from an inline add row. Returns false (keeping the row's
   * text) when the name already exists in the target category. The mutation
   * is fire-and-forget: the optimistic insert re-sections instantly, and
   * awaiting would blur the input and close the keyboard between consecutive
   * adds.
   */
  function handleInlineAdd(
    name: string,
    category: string | null,
    task: ItemTaskFields = taskDraftToArgs(EMPTY_TASK_DRAFT),
  ): boolean {
    if (!list) {
      return false;
    }
    const duplicate = list.items.some(
      (item) => (item.category ?? null) === category && item.name === name,
    );
    if (duplicate) {
      Alert.alert(tl("itemAlreadyExists"));
      return false;
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
          key={section.title}
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
            droppableId={`section-${section.title}`}
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
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
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
        >
          {checklistBody}
        </ScrollView>
      )}

      <ItemSheet
        visible={itemSheetOpen}
        projectId={pid}
        taskMode={taskMode}
        name={draftName}
        details={draftDetails}
        category={draftCategory}
        categories={categories ?? []}
        task={draftTask}
        onChangeName={setDraftName}
        onChangeDetails={setDraftDetails}
        onChangeCategory={setDraftCategory}
        onChangeTask={setDraftTask}
        onSubmit={submitItem}
        onDelete={deleteCurrentItem}
        onClose={() => setItemSheetOpen(false)}
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

/**
 * A list row wrapped in a Draggable. The drag starts from the grip handle
 * (immediately — no long-press), so the affordance is visible and taps/scroll
 * elsewhere on the row keep working. While dragging, the row lifts (scale +
 * shadow); rows shuffle smoothly (layout transitions) as items change
 * sections.
 */
function DraggableItemRow({
  item,
  memberById,
  autoScrollComp,
  onToggle,
  onEdit,
}: {
  item: Item;
  taskMode: boolean;
  memberById: MemberById;
  autoScrollComp: SharedValue<number>;
  onToggle: (item: Item) => void;
  onEdit: (item: Item) => void;
}) {
  const t = useTheme();
  const [dragging, setDragging] = useState(false);
  const lift = useSharedValue(0);
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + lift.value * 0.03 }],
    shadowOpacity: lift.value * 0.3,
    elevation: lift.value * 8,
  }));
  // Counter the page's auto-scroll so this row, while it's the one being
  // dragged, stays under the finger instead of scrolling away with the content
  // it lives in. Applied only while dragging (see the wrapper below), so other
  // rows scroll normally.
  const autoScrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: autoScrollComp.value }],
  }));

  return (
    // The outer wrapper is the row's flex slot, so it (not the inner view) is
    // what reflows when items re-sort or change sections — the layout/enter/
    // exit animations must live here to fire. The Draggable's own translation
    // during a drag stays on the inner view, so this wrapper's layout only
    // animates on commits (toggle re-sort, category move, no-op reset).
    <Animated.View
      entering={FadeIn.duration(160)}
      // Also softens the reset-key remounts after a no-op drop: the stuck
      // row cross-fades back into its home slot.
      exiting={FadeOut.duration(160)}
      layout={ITEM_TRANSITION}
      // Stack the lifted row above its sibling rows; the parent section is
      // raised above sibling sections separately. The auto-scroll
      // counter-translation rides here too so it shifts the whole flex slot.
      style={dragging ? [{ zIndex: 100 }, autoScrollStyle] : undefined}
    >
      <Draggable<DragData>
        draggableId={item._id}
        data={{ id: item._id }}
        dragAxis="y"
        collisionAlgorithm="center"
        onStateChange={(state) => {
          const isDragging = state === DraggableState.DRAGGING;
          setDragging(isDragging);
          lift.value = withTiming(isDragging ? 1 : 0, { duration: 150 });
        }}
      >
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderColor: t.border,
              backgroundColor: t.bg,
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
            },
            liftStyle,
          ]}
        >
          <Pressable
            // Remounting on toggle keeps every style set at mount, sidestepping
            // the Android Fabric bug where recoloring a mounted View drops its
            // borderRadius; it also replays the fill's entering animation.
            key={item.completed ? "checked" : "unchecked"}
            onPress={() => onToggle(item)}
            hitSlop={8}
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: item.completed ? t.primary : t.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.completed ? (
              // The fill zooms in from the center on completion; it sits inside
              // the border (insets are relative to the padding box), so the
              // inner radius is the outer one minus the border width.
              <Animated.View
                entering={ZoomIn.duration(150)}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  borderRadius: 6,
                  backgroundColor: t.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check color={t.onPrimary} size={16} strokeWidth={3} />
              </Animated.View>
            ) : null}
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => onEdit(item)}>
            <Txt size={16} muted={item.completed} strike={item.completed}>
              {item.name}
            </Txt>
            {item.details ? (
              <Txt muted size={13}>
                {item.details}
              </Txt>
            ) : null}
            <TaskRowMeta item={item} memberById={memberById} />
          </Pressable>
          <Draggable.Handle
            style={{
              alignSelf: "stretch",
              justifyContent: "center",
              paddingLeft: 8,
              paddingVertical: 4,
            }}
          >
            <GripVertical color={t.muted} size={18} />
          </Draggable.Handle>
        </Animated.View>
      </Draggable>
    </Animated.View>
  );
}

/**
 * The task-mode metadata strip under a row's name: a priority flag (omitted for
 * normal), a due-date chip (red when overdue and still open), and the assignee
 * avatar with name. Rendered only on task lists, so plain checklists are unaffected.
 */
function TaskRowMeta({
  item,
  memberById,
}: {
  item: Item;
  memberById: MemberById;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const formatDue = useFormatDue();
  const priority = item.priority ?? "normal";
  const repeat = presetForRecurrence(item.recurrence);
  const assignee =
    item.assigneeId !== undefined ? memberById.get(item.assigneeId) : undefined;
  const overdue =
    item.dueAt !== undefined && !item.completed && item.dueAt < Date.now();

  if (
    priority === "normal" &&
    item.dueAt === undefined &&
    !assignee &&
    repeat === "none"
  ) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
      }}
    >
      {assignee ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Avatar
            name={assignee.name}
            image={assignee.image}
            color={assignee.avatarColor}
            size={18}
          />
          <Txt muted size={12} numberOfLines={1}>
            {assignee.name}
          </Txt>
        </View>
      ) : null}
      {priority !== "normal" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Flag
            color={priorityColor(t, priority)}
            fill={priorityColor(t, priority)}
            size={12}
          />
          <Txt size={12} style={{ color: priorityColor(t, priority) }}>
            {tl(`priority_${priority}`)}
          </Txt>
        </View>
      ) : null}
      {item.dueAt !== undefined ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <CalendarClock color={overdue ? t.danger : t.muted} size={12} />
          <Txt size={12} style={{ color: overdue ? t.danger : t.muted }}>
            {formatDue({ dueAt: item.dueAt, dueAllDay: item.dueAllDay })}
          </Txt>
        </View>
      ) : null}
      {repeat !== "none" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Repeat color={t.muted} size={12} />
          <Txt muted size={12}>
            {tl(`repeat_${repeat}`)}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

/**
 * A placeholder drop target rendered like a would-be section: dropping an item
 * on it removes its category or prompts for a new one. Shares the candidate
 * sections' dashed visual language; hovering fills it like a real target.
 */
function GhostDropSection({
  droppableId,
  icon,
  label,
  onDrop,
}: {
  droppableId: string;
  icon: "none" | "new";
  label: string;
  onDrop: (data: DragData) => void;
}) {
  const t = useTheme();
  return (
    <Droppable<DragData>
      droppableId={droppableId}
      onDrop={onDrop}
      style={{
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: `${t.primary}80`,
        borderRadius: 12,
        backgroundColor: t.card,
      }}
      activeStyle={{
        backgroundColor: `${t.primary}14`,
        borderColor: t.primary,
        transform: [{ scale: 1.02 }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          // Taller than an item row, so the target stays visible around the
          // row being dragged over it.
          minHeight: 76,
          paddingVertical: 14,
          paddingHorizontal: 10,
        }}
      >
        {icon === "new" ? (
          <Plus color={t.primary} size={16} />
        ) : (
          <Tag color={t.muted} size={16} />
        )}
        <Txt size={13} numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </Droppable>
  );
}

/** Prompt for the name when an item is dropped on the "new category" zone. */
function NewCategorySheet({
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
function ItemSheet({
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
