"use client";

import { Trash2 } from "lucide-react";
import { useLogger } from "next-axiom";
import React from "react";
import { toast } from "sonner";
import type { Category } from "@/app/_data/category";
import { Button } from "@/components/ui/button";
import ModalAction from "@/components/ui/modal-action";
import { deleteCategory } from "./actions";

export default function DeleteCategoryButton({
  category,
}: {
  category: Category;
}) {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const log = useLogger();

  async function handleDelete() {
    try {
      await deleteCategory(category);
      toast.success("La categoria s'ha eliminat correctament");
    } catch (e) {
      log.error("Error deleting category", {
        error: e,
        categoryId: category.id,
      });
      toast.error("Error eliminant la categoria. Torna-ho a provar més tard");
    }
  }

  return (
    <>
      <Button
        onClick={() => triggerRef.current?.click()}
        variant="ghost"
        size="icon"
        className="text-destructive"
        aria-label="Eliminar categoria"
      >
        <Trash2 />
      </Button>

      <ModalAction
        triggerRef={triggerRef}
        title="Eliminar categoria"
        description={`Segur que vols eliminar la categoria ${category.name}?
          Aquesta acció no es pot desfer, i els elements d'aquesta categoria passaran a estar sense categoria.`}
        actionText="Eliminar"
        variant="destructive"
        onAction={handleDelete}
      />
    </>
  );
}
