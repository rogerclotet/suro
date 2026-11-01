import { api } from "backend/convex/_generated/api";
import { DUE_BUCKETS, type DueBucket, dueBucket } from "domain/tasks";
import { Stack, usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import { SectionList, View } from "react-native";
import { useFormatDue } from "@/components/task-fields";
import { type AssignedTask, TaskRow } from "@/components/task-row";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { listRoute } from "@/lib/tab-routes";
import { useTheme } from "@/theme";
import { Loading, Screen, Txt } from "@/ui";

type AgendaSection = { key: DueBucket; title: string; data: AssignedTask[] };

const BUCKET_TITLES = {
  overdue: "agendaOverdue",
  today: "agendaToday",
  upcoming: "agendaUpcoming",
  noDate: "agendaNoDate",
} as const satisfies Record<DueBucket, string>;

/**
 * The "My tasks" agenda: the current user's incomplete assigned tasks across the
 * project's task-mode lists (server-sorted by due date), grouped into
 * Overdue/Today/Upcoming/No-date by the local day. A read-only screen, so it
 * uses the cached persistent query with no outbox overlay (an accepted v1 gap).
 * Lists and Home both host it; each task's list opens in the same tab.
 */
export default function MyTasksScreen() {
  const pid = useProjectId();
  const router = useRouter();
  const pathname = usePathname();
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
    const now = new Date();
    const buckets: Record<DueBucket, AssignedTask[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
    };
    // The server already sorts by (dueAt asc, no-due last, priority, name), so
    // pushing in order keeps each bucket sorted.
    for (const task of tasks) {
      buckets[dueBucket(task, now)].push(task);
    }
    return DUE_BUCKETS.map((key) => ({
      key,
      title: tl(BUCKET_TITLES[key]),
      data: buckets[key],
    })).filter((section) => section.data.length > 0);
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
                  pathname: listRoute(pid, pathname, item.listId),
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
