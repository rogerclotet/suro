import {
  CalendarClock,
  Check,
  Flag,
  GripVertical,
  Plus,
  Repeat,
  Tag,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import {
  Draggable,
  DraggableState,
  Droppable,
} from "react-native-reanimated-dnd";
import { Avatar } from "@/components/avatar";
import { priorityColor, useFormatDue } from "@/components/task-fields";
import { useTranslations } from "@/i18n";
import { presetForRecurrence } from "@/lib/recurrence";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import { ITEM_TRANSITION } from "./transitions";
import type { DragData, Item, MemberById } from "./types";

export function DraggableItemRow({
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
            kind="user"
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
export function GhostDropSection({
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
