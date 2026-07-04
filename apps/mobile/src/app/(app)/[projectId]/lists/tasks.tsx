import { api } from "backend/convex/_generated/api";
import type { Doc } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { CalendarClock, Flag } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, SectionList, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { priorityColor, useFormatDue } from "@/components/task-fields";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Loading, Screen, Txt } from "@/ui";

type Task = Doc<"listItems"> & { listName: string };
type Member = FunctionReturnType<typeof api.projects.members>[number];
type Bucket = "overdue" | "today" | "upcoming" | "noDate";
type AgendaSection = { key: Bucket; title: string; data: Task[] };

/**
 * The local calendar day a due moment falls on, as a numeric YYYYMMDD code for
 * easy comparison. All-day dues are stored at UTC midnight (a date, not an
 * instant), so their day is read from the UTC parts; timed dues use the local
 * day of the instant. Mirrors the editor's `dayOfDue`.
 */
function dueDayCode(task: Task): number {
  const d = new Date(task.dueAt ?? 0);
  if (task.dueAllDay) {
    return (
      d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
    );
  }
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function todayCode(now: Date): number {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/** Which agenda bucket a task lands in, relative to the local "today". */
function bucketFor(task: Task, today: number): Bucket {
  if (task.dueAt === undefined) {
    return "noDate";
  }
  const day = dueDayCode(task);
  if (day < today) {
    return "overdue";
  }
  if (day === today) {
    return "today";
  }
  return "upcoming";
}

/**
 * The "My tasks" agenda: the current user's incomplete assigned tasks across the
 * project's task-mode lists (server-sorted by due date), grouped into
 * Overdue/Today/Upcoming/No-date by the local day. A read-only screen, so it
 * uses the cached persistent query with no outbox overlay (an accepted v1 gap).
 */
export default function MyTasksScreen() {
  const pid = useProjectId();
  const router = useRouter();
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tasks = usePersistentQuery(api.tasks.myTasks, { projectId: pid });
  const members = usePersistentQuery(api.projects.members, { projectId: pid });
  const formatDue = useFormatDue();

  const memberById = useMemo(
    () => new Map((members ?? []).map((member) => [member._id, member])),
    [members],
  );

  const sections = useMemo<AgendaSection[]>(() => {
    if (!tasks) {
      return [];
    }
    const today = todayCode(new Date());
    const buckets: Record<Bucket, Task[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
    };
    // The server already sorts by (dueAt asc, no-due last, priority, name), so
    // pushing in order keeps each bucket sorted.
    for (const task of tasks) {
      buckets[bucketFor(task, today)].push(task);
    }
    const order: { key: Bucket; title: string }[] = [
      { key: "overdue", title: tl("agendaOverdue") },
      { key: "today", title: tl("agendaToday") },
      { key: "upcoming", title: tl("agendaUpcoming") },
      { key: "noDate", title: tl("agendaNoDate") },
    ];
    return order
      .map(({ key, title }) => ({ key, title, data: buckets[key] }))
      .filter((section) => section.data.length > 0);
  }, [tasks, tl]);

  return (
    <Screen>
      <Stack.Screen options={{ title: tl("myTasks") }} />
      {tasks === undefined ? (
        <Loading />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 96 }}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <Txt muted style={{ paddingVertical: 24, textAlign: "center" }}>
              {tl("noTasks")}
            </Txt>
          }
          renderSectionHeader={({ section }) => (
            <Txt
              muted
              size={12}
              style={{
                paddingTop: 16,
                paddingBottom: 4,
                paddingHorizontal: 16,
                letterSpacing: 1,
              }}
            >
              {section.title.toUpperCase()}
            </Txt>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                marginHorizontal: 16,
                backgroundColor: t.border,
              }}
            />
          )}
          renderItem={({ item, section }) => (
            <TaskRow
              task={item}
              overdue={section.key === "overdue"}
              assignee={
                item.assigneeId ? memberById.get(item.assigneeId) : undefined
              }
              formatDue={formatDue}
              onPress={() =>
                router.push({
                  pathname: `/${pid}/lists/${item.listId}`,
                  params: { name: item.listName },
                })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

function TaskRow({
  task,
  overdue,
  assignee,
  formatDue,
  onPress,
}: {
  task: Task;
  overdue: boolean;
  assignee: Member | undefined;
  formatDue: (item: { dueAt: number; dueAllDay?: boolean }) => string;
  onPress: () => void;
}) {
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const priority = task.priority ?? "normal";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
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
          name={assignee.name}
          image={assignee.image}
          color={assignee.avatarColor}
          size={28}
        />
      ) : null}
    </Pressable>
  );
}
