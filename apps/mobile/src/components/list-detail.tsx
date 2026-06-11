import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import {
  Check,
  Ellipsis,
  GripVertical,
  LayoutTemplate,
  ListX,
  Plus,
  Star,
  Tag,
  Trash2,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Draggable,
  DraggableState,
  DropProvider,
  type DropProviderRef,
  Droppable,
} from "react-native-reanimated-dnd";
import { CategoryPicker } from "@/components/category-picker";
import { InlineAddItemRow } from "@/components/inline-add-item";
import { useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import {
  Button,
  Field,
  HEADER_BUTTON_INSET,
  IconAction,
  IconActionBar,
  Loading,
  Screen,
  Sheet,
  Txt,
} from "@/ui";

type ListResult = NonNullable<FunctionReturnType<typeof api.lists.get>>;
type Item = ListResult["items"][number];
type Category = FunctionReturnType<typeof api.categories.listByProject>[number];
/** Payload carried by a dragged item row into the drop zones. */
type DragData = { id: Id<"listItems"> };

type Section = { title: string; category: string | null; data: Item[] };

// Module-level counter for optimistic item ids (Hermes has no crypto.randomUUID).
let optimisticItemCounter = 0;
function nextOptimisticItemId(): Id<"listItems"> {
  optimisticItemCounter += 1;
  return `optimistic-item-${optimisticItemCounter}` as Id<"listItems">;
}

function groupByCategory(items: Item[], uncategorized: string): Section[] {
  const groups = new Map<string, Section>();
  for (const item of items) {
    const category = item.category ?? null;
    const title = category ?? uncategorized;
    const bucket = groups.get(title);
    if (bucket) {
      bucket.data.push(item);
    } else {
      groups.set(title, { title, category, data: [item] });
    }
  }
  // The uncategorized bucket always sorts last so its items sit right above
  // the bottom inline add row (the no-category entry point).
  return [...groups.values()].sort((a, b) => {
    if (a.category === null) return 1;
    if (b.category === null) return -1;
    return a.title.localeCompare(b.title);
  });
}

/**
 * The full list-detail screen, rendered by a route's nested Stack. It lives in
 * `components` rather than a route file because the same screen is reachable
 * from two stacks: the lists tab (`lists/[listId]`) and the calendar tab
 * (`calendar/list/[listId]`, so Back from a list opened off an event returns to
 * the event). `initialTitle` seeds the header so it doesn't flash the route
 * segment while the list query resolves.
 *
 * Items render in a plain ScrollView (not a SectionList): each category
 * section is a Droppable and each row a long-press Draggable, and the DnD
 * layer needs real container views + stable measurements, which virtualized
 * cells don't provide. Household-sized lists make this a non-issue.
 */
export function ListDetailScreen({
  listId,
  initialTitle,
}: {
  listId: string;
  initialTitle?: string;
}) {
  const pid = useProjectId();
  const lid = listId as Id<"lists">;
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  const timeAgo = useTimeAgo();
  const router = useRouter();

  const list = useQuery(api.lists.get, { listId: lid });

  // `null` means the list no longer exists (deleted here or from another
  // client); leave the now-empty detail screen instead of rendering stale chrome.
  useEffect(() => {
    if (list === null && router.canGoBack()) {
      router.back();
    }
  }, [list, router]);
  const categories = useQuery(api.categories.listByProject, { projectId: pid });
  // Optimistic so the new row (and a brand-new category section) mounts in the
  // same commit as the focus-follow state change — the inline input can grab
  // focus without waiting a server round-trip or bouncing the keyboard.
  const createItem = useMutation(api.listItems.create).withOptimisticUpdate(
    (store, args) => {
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
            },
          ],
        },
      );
    },
  );
  const removeItem = useMutation(api.listItems.remove);
  const toggleFavorite = useMutation(api.lists.toggleFavorite);
  const updateList = useMutation(api.lists.update);
  const removeList = useMutation(api.lists.remove);
  const clearCompleted = useMutation(api.lists.clearCompleted);
  // Optimistic so checkbox toggles and drag-drops re-section instantly instead
  // of waiting a server round-trip.
  const updateItem = useMutation(api.listItems.update).withOptimisticUpdate(
    (store, args) => {
      const current = store.getQuery(api.lists.get, { listId: lid });
      if (!current) {
        return;
      }
      store.setQuery(
        api.lists.get,
        { listId: lid },
        {
          ...current,
          items: current.items.map((item) =>
            item._id === args.itemId
              ? {
                  ...item,
                  name: args.name,
                  details: args.details?.trim() || undefined,
                  completed: args.completed,
                  category: args.category?.trim() || undefined,
                }
              : item,
          ),
        },
      );
    },
  );

  // Editing happens in a drawer (`ItemSheet`); the target and drafts persist
  // while the sheet slides out so its content doesn't flicker during the close
  // animation. Creation is inline: `activeAddCategory` tracks which section's
  // add row is expanded (undefined = none, null = the bottom no-category row,
  // a string = that category's row) and is set after each add so focus follows
  // the item into the category it went to.
  const [activeAddCategory, setActiveAddCategory] = useState<
    string | null | undefined
  >(undefined);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDetails, setDraftDetails] = useState("");
  const [draftCategory, setDraftCategory] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  // Opening the import sheet while the settings sheet is still animating out
  // would stack two Modals; defer it until settings reports it has closed.
  const [pendingImport, setPendingImport] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");

  // Drag-and-drop state. `draggingItem` marks the source section while the
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

  const uncategorized = tl("uncategorized");
  const sections = useMemo(
    () => (list ? groupByCategory(list.items, uncategorized) : []),
    [list, uncategorized],
  );

  // Render the header title from the loaded list, falling back to the name
  // passed at navigation time so the title never flashes the "[listId]" route
  // segment while the list query resolves.
  const headerTitle = list?.name ?? initialTitle ?? "";

  function toggle(item: Item) {
    void updateItem({
      itemId: item._id,
      name: item.name,
      details: item.details ?? "",
      completed: !item.completed,
      category: item.category ?? null,
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
    const now = Date.now();
    if (now - lastPositionUpdate.current > 100) {
      lastPositionUpdate.current = now;
      refreshDropPositions();
    }
  }

  /**
   * Create an item from an inline add row. Returns false (keeping the row's
   * text) when the name already exists in the target category. The mutation
   * is fire-and-forget: the optimistic insert re-sections instantly, and
   * awaiting would blur the input and close the keyboard between consecutive
   * adds.
   */
  function handleInlineAdd(name: string, category: string | null): boolean {
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
    void createItem({ listId: lid, name, category });
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

  function openSettings() {
    if (!list) {
      return;
    }
    setListName(list.name);
    setListDescription(list.description ?? "");
    setSettingsOpen(true);
  }

  async function saveSettings() {
    setSettingsOpen(false);
    await updateList({
      listId: lid,
      name: listName.trim() || (list?.name ?? ""),
      description: listDescription,
    });
  }

  function handleDeleteList() {
    if (!list) {
      return;
    }
    // Confirm before the irreversible delete; keep the settings sheet open
    // behind the alert so cancelling lands back where the user was.
    Alert.alert(
      tl("deleteList"),
      tl("deleteListMessage", { name: list.name }),
      [
        { text: tc("cancel"), style: "cancel" },
        {
          text: tc("delete"),
          style: "destructive",
          onPress: () => {
            setSettingsOpen(false);
            void removeList({ listId: lid }).then(() => router.back());
          },
        },
      ],
    );
  }

  function handleClearCompleted() {
    // Removing completed items is irreversible; confirm first, keeping the
    // settings sheet open behind the alert so cancelling lands back where the
    // user was.
    Alert.alert(tl("clearCompleted"), tl("clearCompletedMessage"), [
      { text: tc("cancel"), style: "cancel" },
      {
        text: tl("clearCompletedAction"),
        style: "destructive",
        onPress: () => {
          setSettingsOpen(false);
          void clearCompleted({ listId: lid });
        },
      },
    ]);
  }

  function handleToggleFavorite() {
    void toggleFavorite({ listId: lid });
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: headerTitle,
          ...(list
            ? {
                // Creation is inline (the per-section add rows), so the header
                // only carries the settings overflow on both platforms.
                headerRight: () => (
                  <Pressable
                    onPress={openSettings}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={tl("listSettings")}
                    style={{ paddingHorizontal: HEADER_BUTTON_INSET }}
                  >
                    <Ellipsis color={t.primary} size={22} />
                  </Pressable>
                ),
              }
            : {}),
        }}
      />

      {list == null ? (
        <Loading />
      ) : (
        <DropProvider
          ref={dropProviderRef}
          onDragStart={(data: DragData) => {
            dragActive.value = withTiming(1, { duration: 150 });
            setDraggingItem(
              list.items.find((item) => item._id === data.id) ?? null,
            );
          }}
          onDragEnd={() => {
            dragActive.value = withTiming(0, { duration: 200 });
            setDraggingItem(null);
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            // iOS: inset the content so the focused inline input (especially
            // the bottom add row) scrolls above the keyboard. Android relies
            // on the window's adjustResize.
            automaticallyAdjustKeyboardInsets
            onScroll={handleScroll}
            scrollEventThrottle={100}
            onScrollEndDrag={refreshDropPositions}
            onMomentumScrollEnd={refreshDropPositions}
            onContentSizeChange={refreshDropPositions}
            onLayout={refreshDropPositions}
          >
            {/* The list's blurb and provenance. The "updated" stamp only
                appears once the list has been edited after creation
                (updatedAt starts below _creationTime). */}
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

            {list.items.length === 0 ? (
              <Txt muted style={{ padding: 16 }}>
                {tl("noItems")}
              </Txt>
            ) : null}

            {sections.map((section) => (
              <Animated.View
                key={section.title}
                layout={LinearTransition.duration(200)}
                // The section a row is dragged out of must stack above its
                // sibling sections, or the lifted row slides underneath them.
                style={
                  draggingItem &&
                  (draggingItem.category ?? null) === section.category
                    ? { zIndex: 10 }
                    : undefined
                }
              >
                <Droppable<DragData>
                  droppableId={`section-${section.title}`}
                  onDrop={(data) => moveItem(data.id, section.category)}
                  // While a drag is active, candidate sections (all but the
                  // row's own) show a dashed outline so it's clear dropping
                  // moves the item to that category. The constant border +
                  // padding/margin pair keeps rows from shifting when the
                  // outline appears.
                  style={{
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderRadius: 12,
                    paddingHorizontal: 6,
                    marginHorizontal: -6,
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
                  {sections.length > 1 ? (
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
                      // The reset key remounts rows after a no-op drop,
                      // clearing the library's lingering drop-slot translation.
                      key={`${item._id}:${dragResetKey}`}
                      item={item}
                      onToggle={toggle}
                      onEdit={openEdit}
                    />
                  ))}
                  {/* Items created here go straight to this category; the
                      no-category entry point is the bottom row below. */}
                  {section.category !== null ? (
                    <InlineAddItemRow
                      active={activeAddCategory === section.category}
                      onActivate={() => setActiveAddCategory(section.category)}
                      onDeactivate={() => deactivateAddRow(section.category)}
                      onSubmit={(name) =>
                        handleInlineAdd(name, section.category)
                      }
                    />
                  ) : null}
                </Droppable>
              </Animated.View>
            ))}

            {/* The always-visible no-category entry point; the only row with a
                category quick-selector. The uncategorized section sorts last,
                so this row sits right beneath its items. */}
            <InlineAddItemRow
              active={activeAddCategory === null}
              withCategoryPicker
              categories={categories ?? []}
              onActivate={() => setActiveAddCategory(null)}
              onDeactivate={() => deactivateAddRow(null)}
              onSubmit={handleInlineAdd}
            />

            {/* Ghost drop sections: placeholder targets that fade in below the
                real sections while a drag is active. Kept mounted (their slots
                must stay registered through the end-of-drag callbacks) and only
                conditioned on data, which can't change mid-drop. */}
            {list.items.length > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[{ paddingTop: 14, gap: 10 }, ghostDropStyle]}
              >
                {sections.some(
                  (section) => section.category === null,
                ) ? null : (
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
          </ScrollView>

          <ItemSheet
            visible={itemSheetOpen}
            name={draftName}
            details={draftDetails}
            category={draftCategory}
            categories={categories ?? []}
            onChangeName={setDraftName}
            onChangeDetails={setDraftDetails}
            onChangeCategory={setDraftCategory}
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

          <SettingsSheet
            visible={settingsOpen}
            name={listName}
            description={listDescription}
            favorite={list.favorite}
            onChangeName={setListName}
            onChangeDescription={setListDescription}
            onToggleFavorite={handleToggleFavorite}
            onSave={saveSettings}
            onImportTemplates={() => {
              setPendingImport(true);
              setSettingsOpen(false);
            }}
            onClearCompleted={handleClearCompleted}
            onDelete={handleDeleteList}
            onClose={() => setSettingsOpen(false)}
            onClosed={() => {
              if (pendingImport) {
                setPendingImport(false);
                setImportOpen(true);
              }
            }}
          />

          <ImportTemplatesSheet
            visible={importOpen}
            projectId={pid}
            listId={lid}
            onClose={() => setImportOpen(false)}
          />
        </DropProvider>
      )}
    </Screen>
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
  onToggle,
  onEdit,
}: {
  item: Item;
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

  return (
    <Draggable<DragData>
      draggableId={item._id}
      data={{ id: item._id }}
      dragAxis="y"
      collisionAlgorithm="center"
      // Stack the lifted row above its sibling rows; the parent section is
      // raised above sibling sections separately.
      style={dragging ? { zIndex: 100 } : undefined}
      onStateChange={(state) => {
        const isDragging = state === DraggableState.DRAGGING;
        setDragging(isDragging);
        lift.value = withTiming(isDragging ? 1 : 0, { duration: 150 });
      }}
    >
      <Animated.View
        entering={FadeIn.duration(150)}
        layout={LinearTransition.duration(200)}
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
          onPress={() => onToggle(item)}
          hitSlop={8}
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: item.completed ? t.primary : t.muted,
            backgroundColor: item.completed ? t.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.completed ? (
            <Check color={t.onPrimary} size={16} strokeWidth={3} />
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
  name,
  details,
  category,
  categories,
  onChangeName,
  onChangeDetails,
  onChangeCategory,
  onSubmit,
  onDelete,
  onClose,
}: {
  visible: boolean;
  name: string;
  details: string;
  category: string | null;
  categories: Category[];
  onChangeName: (value: string) => void;
  onChangeDetails: (value: string) => void;
  onChangeCategory: (value: string | null) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  return (
    <Sheet visible={visible} onClose={onClose}>
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
    </Sheet>
  );
}

function SettingsSheet({
  visible,
  name,
  description,
  favorite,
  onChangeName,
  onChangeDescription,
  onToggleFavorite,
  onSave,
  onImportTemplates,
  onClearCompleted,
  onDelete,
  onClose,
  onClosed,
}: {
  visible: boolean;
  name: string;
  description: string;
  favorite: boolean;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onToggleFavorite: () => void;
  onSave: () => void;
  onImportTemplates: () => void;
  onClearCompleted: () => void;
  onDelete: () => void;
  onClose: () => void;
  onClosed: () => void;
}) {
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  return (
    <Sheet visible={visible} onClose={onClose} onClosed={onClosed}>
      <Txt size={18} weight="700">
        {tl("listSettings")}
      </Txt>
      <Field
        placeholder={tl("namePlaceholder")}
        value={name}
        onChangeText={onChangeName}
      />
      <Field
        placeholder={tl("descriptionPlaceholder")}
        value={description}
        onChangeText={onChangeDescription}
        multiline
        textAlignVertical="top"
        style={{ minHeight: 88, paddingTop: 11 }}
      />
      <Button title={tc("save")} onPress={onSave} />
      {/* Secondary list actions as a compact icon toolbar. */}
      <IconActionBar>
        <IconAction
          icon={Star}
          active={favorite}
          caption={tl("favoriteCaption")}
          label={favorite ? tl("removeFromFavorites") : tl("addToFavorites")}
          onPress={onToggleFavorite}
        />
        <IconAction
          icon={LayoutTemplate}
          caption={tl("templatesCaption")}
          label={tl("importTemplates")}
          onPress={onImportTemplates}
        />
        <IconAction
          icon={ListX}
          caption={tl("clearCaption")}
          label={tl("clearCompleted")}
          onPress={onClearCompleted}
        />
        <IconAction
          icon={Trash2}
          destructive
          caption={tl("deleteCaption")}
          label={tl("deleteList")}
          onPress={onDelete}
        />
      </IconActionBar>
    </Sheet>
  );
}

function ImportTemplatesSheet({
  visible,
  projectId,
  listId,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  listId: Id<"lists">;
  onClose: () => void;
}) {
  const templates = useQuery(api.templates.listByProject, { projectId });
  const importTemplates = useMutation(api.lists.importTemplates);
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const [selected, setSelected] = useState<Id<"listTemplates">[]>([]);
  const [busy, setBusy] = useState(false);

  function toggle(id: Id<"listTemplates">) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submit() {
    if (selected.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await importTemplates({ listId, templateIds: selected });
      setSelected([]);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        setSelected([]);
        onClose();
      }}
    >
      <Txt size={18} weight="700">
        {tl("importTemplates")}
      </Txt>
      {templates && templates.length > 0 ? (
        <ScrollView style={{ maxHeight: 260 }}>
          {templates.map((template) => (
            <View
              key={template._id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 6,
              }}
            >
              <Switch
                value={selected.includes(template._id)}
                onValueChange={() => toggle(template._id)}
                trackColor={{ true: t.primary, false: t.border }}
              />
              <Txt style={{ flex: 1 }}>
                {template.name} ({template.items.length})
              </Txt>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Txt muted style={{ paddingVertical: 8 }}>
          {tl("noTemplates")}
        </Txt>
      )}
      <Button
        title={busy ? tl("importing") : tl("importSelected")}
        disabled={busy || selected.length === 0}
        onPress={submit}
      />
    </Sheet>
  );
}
