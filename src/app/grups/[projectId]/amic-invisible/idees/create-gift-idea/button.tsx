"use client";

import { PlusIcon } from "lucide-react";
import Action from "@/components/action";
import ModalForm from "@/components/ui/modal-form";
import GiftIdeaForm from "../create-gift-idea-form";

export default function CreateGiftIdeaButton() {
  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label="Afegir idea" />}
      title="Afegir idea"
      description="Afegir una idea per a l'Amic Invisible"
    >
      <GiftIdeaForm />
    </ModalForm>
  );
}
