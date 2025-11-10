"use client";

import { PlusIcon } from "lucide-react";
import type { GiftIdeaData } from "@/app/_data/secret-santa";
import Action from "@/components/action";
import ModalForm from "@/components/ui/modal-form";
import GiftIdeaForm from "./form";

export default function CreateGiftIdeaButton({
  nextId,
  onCreate,
}: {
  projectId: string;
  secretSantaId: string;
  nextId: number;
  onCreate: (data: GiftIdeaData) => Promise<void>;
}) {
  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label="Afegir idea" />}
      title="Afegir idea"
      description="Afegir una idea per a l'Amic Invisible"
    >
      <GiftIdeaForm
        giftIdea={{ id: nextId, name: "", description: "", url: "" }}
        onChange={onCreate}
      />
    </ModalForm>
  );
}
