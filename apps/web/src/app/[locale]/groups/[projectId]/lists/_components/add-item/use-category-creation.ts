"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useCallback } from "react";
import { toast } from "sonner";
import { useProjects } from "@/app/_state/project-state";
import { createCategory } from "../../[listId]/_components/categories/actions";

/**
 * Creates a category inline (server + local store) and returns its id so the
 * caller can immediately select it. Awaiting the returned id guarantees the
 * store is updated before selection, so no deferral/setTimeout is needed.
 */
export function useCategoryCreation(): {
  createAndSelect: (name: string) => Promise<string>;
} {
  const { project, addCategory } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("categories");

  const createAndSelect = useCallback(
    async (name: string) => {
      if (!project) {
        throw new Error("No project selected");
      }

      try {
        const categoryId = await createCategory(project, { name });
        addCategory({ id: categoryId, name, projectId: project.id });
        toast.success(t("createSuccess", { name }));
        return categoryId;
      } catch (e) {
        posthog.captureException(e, {
          distinctId: session?.user.id,
          action: "create_category",
          projectId: project.id,
        });
        toast.error(t("createError"));
        throw e;
      }
    },
    [project, addCategory, session?.user.id, t],
  );

  return { createAndSelect };
}
