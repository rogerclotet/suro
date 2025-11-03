"use client";

import { PlusIcon } from "lucide-react";
import { useRef } from "react";
import Action from "@/components/action";
import NewCategoryModal from "../../[listId]/_components/categories/new-category-modal";

export default function NewCategoryButton() {
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Action
        label="Crear categoria"
        icon={<PlusIcon />}
        pathParts={["llistes", "categories"]}
        onClick={() => triggerRef.current?.click()}
      />

      <NewCategoryModal triggerRef={triggerRef} />
    </>
  );
}
