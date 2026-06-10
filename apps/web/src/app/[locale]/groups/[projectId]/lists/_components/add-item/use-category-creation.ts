"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useCallback } from "react";
import { toast } from "sonner";
import { useProjects } from "@/app/_state/project-state";
import { useSession } from "@/lib/session";

/**
 * Creates a category inline (Convex + optimistic local store) and returns its id
 * so the caller can immediately select it. The project store also refreshes
 * reactively from Convex, so the optimistic add just avoids a flash.
 */
export function useCategoryCreation(): {
  createAndSelect: (name: string) => Promise<string>;
} {
  const { project, addCategory } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("categories");
  const createCategory = useMutation(api.categories.create);

  const createAndSelect = useCallback(
    async (name: string) => {
      if (!project) {
        throw new Error("No project selected");
      }

      try {
        const categoryId = await createCategory({
          projectId: project.id as Id<"projects">,
          name,
        });
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
    [project, addCategory, session?.user.id, t, createCategory],
  );

  return { createAndSelect };
}
