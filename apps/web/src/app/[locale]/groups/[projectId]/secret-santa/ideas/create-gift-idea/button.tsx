"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("secretSanta");

  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label={t("ideaCreateAction")} />}
      title={t("ideaCreateTitle")}
      description={t("ideaCreateDescription")}
    >
      <GiftIdeaForm
        giftIdea={{ id: nextId, name: "", description: "", url: "" }}
        onChange={onCreate}
      />
    </ModalForm>
  );
}
