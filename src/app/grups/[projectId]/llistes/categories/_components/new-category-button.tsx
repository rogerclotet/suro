"use client";

import { PlusIcon } from "lucide-react";
import Action from "@/components/action";
import NewCategoryModal from "../../[listId]/_components/categories/new-category-modal";

export default function NewCategoryButton() {
  return (
    <NewCategoryModal
      trigger={
        <Action
          label="Crear categoria"
          icon={PlusIcon}
          pathParts={["llistes", "categories"]}
        />
      }
    />
  );
}
