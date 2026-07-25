import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useLocalSearchParams } from "expo-router";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";

const MAX_TAB_LABEL = 10;

function truncateLabel(name: string): string {
  if (name.length <= MAX_TAB_LABEL) {
    return name;
  }
  return `${name.slice(0, MAX_TAB_LABEL - 1)}…`;
}

/** Truncated current group name for the first tab label. */
export function useGroupTabLabel(): string {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = usePersistentQuery(api.projects.get, {
    projectId: projectId as Id<"projects">,
  });
  const tNav = useTranslations("nav");
  return truncateLabel(project?.name ?? tNav("groups"));
}
