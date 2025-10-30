"use client";

import { Plus } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import NewCategoryModal from "../../[listId]/_components/categories/new-category-modal";

export default function NewCategoryButton() {
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Button
        size="sm"
        onClick={() => triggerRef.current?.click()}
        className="flex items-center gap-2"
      >
        <Plus /> Crear categoria
      </Button>

      <NewCategoryModal triggerRef={triggerRef} />
    </>
  );
}
