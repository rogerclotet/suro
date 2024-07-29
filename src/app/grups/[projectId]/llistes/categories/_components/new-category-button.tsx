"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";
import NewCategoryModal from "../../[listId]/_components/categories/new-category-modal";

export default function NewCategoryButton() {
  const triggerRef = React.useRef<HTMLDivElement>(null);

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
