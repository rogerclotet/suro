"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Category } from "@/app/_data/category";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { useSession } from "@/lib/session";

export default function DeleteCategoryButton({
  category,
}: {
  category: Category;
}) {
  const { data: session } = useSession();
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const deleteCategory = useMutation(api.categories.remove);

  async function handleDelete() {
    try {
      await deleteCategory({ categoryId: category.id as Id<"categories"> });
      toast.success(t("deleteSuccess"));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_category",
        projectId: category.projectId,
        categoryId: category.id,
      });
      toast.error(t("deleteError"));
    }
  }

  return (
    <ModalAction
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          aria-label={t("deleteAriaLabel")}
        >
          <Trash2 />
        </Button>
      }
      title={t("deleteTitle")}
      description={t("deleteDescription", { name: category.name })}
      actionText={tCommon("delete")}
      variant="destructive"
      onAction={handleDelete}
    />
  );
}
