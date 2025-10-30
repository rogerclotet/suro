"use client";

import { Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useRef } from "react";
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  async function handleDelete() {
    try {
      await deleteCategory(category);
      toast.success("La categoria s'ha eliminat correctament");
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "delete_category",
        projectId: category.projectId,
        categoryId: category.id,
      });
      toast.error(
        "No s'ha pogut eliminar la categoria, torna-ho a provar més tard",
      );
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
