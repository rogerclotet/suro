"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { GiftIdeaData } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateGiftIdeas } from "@/server/secret-santa";
import CreateGiftIdeaButton from "./create-gift-idea/button";
import GiftIdea from "./gift-idea";

export default function GiftIdeas({
  giftIdeas: startingGiftIdeas,
  secretSantaId,
}: {
  giftIdeas: GiftIdeaData[];
  secretSantaId: string;
}) {
  const [giftIdeas, setGiftIdeas] = useState<GiftIdeaData[]>(startingGiftIdeas);
  const { project } = useProjects();
  const [animationParent] = useAutoAnimate();
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  const nextId =
    giftIdeas.length > 0
      ? Math.max(...giftIdeas.map((giftIdea) => giftIdea.id)) + 1
      : 1;

  async function handleCreate(data: GiftIdeaData) {
    if (!project) {
      return;
    }

    const newGiftIdeas = [...giftIdeas, data];
    setGiftIdeas(newGiftIdeas);

    await updateGiftIdeas(project.id, secretSantaId, newGiftIdeas);
  }

  async function handleEdit(idx: number, data: GiftIdeaData) {
    if (!project) {
      return;
    }

    const newGiftIdeas = [...giftIdeas];
    newGiftIdeas[idx] = data;

    setGiftIdeas(newGiftIdeas);

    await updateGiftIdeas(project.id, secretSantaId, newGiftIdeas);
  }

  async function handleDelete(idx: number) {
    if (!project) {
      return;
    }

    const newGiftIdeas = [...giftIdeas];
    newGiftIdeas.splice(idx, 1);

    setGiftIdeas(newGiftIdeas);

    await updateGiftIdeas(project.id, secretSantaId, newGiftIdeas);
  }

  if (!project) {
    return null;
  }

  return (
    <>
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{tCommon("info")}</AlertTitle>
        <AlertDescription>
          <p>{t("ideasIntro")}</p>
        </AlertDescription>
      </Alert>

      {giftIdeas.length > 0 ? (
        <ul
          ref={animationParent}
          className="columns-1 gap-2 space-y-2 lg:columns-2 2xl:columns-3"
        >
          {giftIdeas.map((giftIdea, index) => (
            <li key={giftIdea.id} className="break-inside-avoid">
              <GiftIdea
                giftIdea={giftIdea}
                onEdit={(data) => handleEdit(index, data)}
                onDelete={() => handleDelete(index)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground italic">{t("ideasEmpty")}</p>
      )}

      <CreateGiftIdeaButton
        projectId={project.id}
        secretSantaId={secretSantaId}
        nextId={nextId}
        onCreate={handleCreate}
      />
    </>
  );
}
