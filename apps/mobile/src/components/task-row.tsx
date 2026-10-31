import type { api } from "backend/convex/_generated/api";
import type { Doc } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { CalendarClock, Flag } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { priorityColor } from "@/components/task-fields";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

export type AssignedTask = Doc<"listItems"> & { listName: string };
type Member = FunctionReturnType<typeof api.projects.members>[number];

/** One of My Tasks: its name, list, due date and priority. */
export function TaskRow({
  task,
  overdue,
  assignee,
  formatDue,
  onPress,
  inset = 16,
}: {
  task: AssignedTask;
  overdue: boolean;
  assignee?: Member;
  formatDue: (item: { dueAt: number; dueAllDay?: boolean }) => string;
  onPress: () => void;
  /** Horizontal padding; Home's panels already pad their rows. */
  inset?: number;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const priority = task.priority ?? "normal";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: inset,
        backgroundColor: pressed ? t.border : "transparent",
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt size={16}>{task.name}</Txt>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Txt muted size={12}>
            {task.listName}
          </Txt>
          {task.dueAt !== undefined ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <CalendarClock color={overdue ? t.danger : t.muted} size={12} />
              <Txt size={12} style={{ color: overdue ? t.danger : t.muted }}>
                {formatDue({ dueAt: task.dueAt, dueAllDay: task.dueAllDay })}
              </Txt>
            </View>
          ) : null}
          {priority !== "normal" ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
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
        </View>
      </View>
      {assignee ? (
        <Avatar
          kind="user"
          name={assignee.name}
          image={assignee.image}
          color={assignee.avatarColor}
          size={28}
        />
      ) : null}
    </Pressable>
  );
}
