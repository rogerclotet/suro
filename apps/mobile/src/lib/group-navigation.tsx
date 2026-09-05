import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import { headerBackAction } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";

/** Only a section root leaves the group. Its nested stack keeps native Back. */
export function useGroupRootOptions(
  section: "home" | "lists" | "calendar" | "expenses",
) {
  const projectId = useProjectId();
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const backToGroups = useCallback(() => router.dismissTo("/groups"), [router]);
  useFocusEffect(
    useCallback(() => {
      if (pathname !== `/${projectId}/${section}`) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          backToGroups();
          return true;
        },
      );
      return () => subscription.remove();
    }, [pathname, projectId, section, backToGroups]),
  );
  return headerBackAction(backToGroups, tNav("groups"));
}
