import { ExternalLinkIcon, PencilIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import type { GiftIdeaData } from "@/app/_data/secret-santa";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import ModalAction from "@/components/ui/modal-action";
import ModalForm from "@/components/ui/modal-form";
import GiftIdeaForm from "./create-gift-idea/form";

export default function GiftIdea({
  giftIdea,
  onEdit,
  onDelete,
}: {
  giftIdea: GiftIdeaData;
  onEdit: (data: GiftIdeaData) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  async function handleEdit(data: GiftIdeaData) {
    await onEdit(data);
  }

  async function handleDelete() {
    await onDelete();
  }

  return (
    <Item variant="card">
      <ItemContent>
        <ItemTitle>{giftIdea.name}</ItemTitle>
        <ItemDescription>
          <span className="block">{giftIdea.description}</span>

          {giftIdea.url && (
            <Link
              href={giftIdea.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-row items-center gap-2 text-muted-foreground"
            >
              <ExternalLinkIcon className="size-4 shrink-0" />
              <span className="wrap-anywhere line-clamp-1 text-sm">
                {giftIdea.url}
              </span>
            </Link>
          )}
        </ItemDescription>
      </ItemContent>

      <ItemActions>
        <ModalForm
          trigger={
            <Button variant="ghost" size="icon-sm">
              <PencilIcon />
            </Button>
          }
          title="Editar idea"
          description={`Editar "${giftIdea.name}"`}
        >
          <GiftIdeaForm giftIdea={giftIdea} onChange={handleEdit} />
        </ModalForm>

        <ModalAction
          title="Eliminar idea"
          description="Estàs segur que vols eliminar aquesta idea? Aquesta acció no es pot desfer."
          actionText="Eliminar"
          onAction={handleDelete}
          variant="destructive"
          trigger={
            <Button variant="ghostDestructive" size="icon-sm">
              <TrashIcon />
            </Button>
          }
        />
      </ItemActions>
    </Item>
  );
}
