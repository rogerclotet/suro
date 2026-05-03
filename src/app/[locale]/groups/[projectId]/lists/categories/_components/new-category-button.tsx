"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Action from "@/components/action";
import NewCategoryModal from "../../[listId]/_components/categories/new-category-modal";

export default function NewCategoryButton() {
  const t = useTranslations("categories");
  return (
    <NewCategoryModal
      trigger={
        <Action
          label={t("createTitle")}
          icon={PlusIcon}
          pathParts={["llistes", "categories"]}
        />
      }
    />
  );
}
