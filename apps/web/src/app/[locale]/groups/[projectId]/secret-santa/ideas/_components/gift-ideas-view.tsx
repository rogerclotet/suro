"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { InfoIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { GiftIdea } from "@/app/_data/secret-santa";
import GiftIdeaContent from "@/app/[locale]/groups/[projectId]/secret-santa/_components/gift-idea-content";
import Action from "@/components/action";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Item, ItemActions } from "@/components/ui/item";
import LoadingPage from "@/components/ui/loading-page";
import ModalAction from "@/components/ui/modal-action";
import ModalForm from "@/components/ui/modal-form";
import { Link } from "@/i18n/navigation";
import { captureException } from "@/lib/error-reporting";
import {
  useCurrentSecretSanta,
  useMyGiftIdeas,
} from "@/lib/queries/use-secret-santa";
import GiftIdeaForm, { type GiftIdeaValues } from "./gift-idea-form";

export default function GiftIdeasView({ projectId }: { projectId: string }) {
  const secretSanta = useCurrentSecretSanta(projectId);
  const giftIdeas = useMyGiftIdeas(
    secretSanta?.isParticipant ? secretSanta.id : undefined,
  );
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  if (secretSanta === undefined) {
    return <LoadingPage />;
  }

  if (secretSanta === null || !secretSanta.isParticipant) {
    return (
      <Alert className="mx-auto max-w-lg">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{tCommon("info")}</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{t("ideasUnavailable")}</p>
          <Link
            href={{
              pathname: "/groups/[projectId]/secret-santa",
              params: { projectId },
            }}
            className="text-primary underline"
          >
            {t("backToSecretSanta")}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const secretSantaId = secretSanta.id as Id<"secretSantas">;

  return (
    <div className="mb-8 space-y-4">
      <h2 className="font-semibold text-2xl">{t("ideasTitle")}</h2>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{tCommon("info")}</AlertTitle>
        <AlertDescription>
          <p>{t("ideasIntro")}</p>
        </AlertDescription>
      </Alert>

      {giftIdeas === undefined ? null : giftIdeas.length === 0 ? (
        <p className="text-muted-foreground italic">{t("ideasEmpty")}</p>
      ) : (
        <ul className="columns-1 gap-2 space-y-2 lg:columns-2 2xl:columns-3">
          {giftIdeas.map((giftIdea) => (
            <li key={giftIdea.id} className="break-inside-avoid">
              <GiftIdeaItem giftIdea={giftIdea} />
            </li>
          ))}
        </ul>
      )}

      <CreateGiftIdeaButton secretSantaId={secretSantaId} />
    </div>
  );
}

function CreateGiftIdeaButton({
  secretSantaId,
}: {
  secretSantaId: Id<"secretSantas">;
}) {
  const create = useMutation(api.secretSantas.createGiftIdea);
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  async function handleCreate(values: GiftIdeaValues) {
    await create({ secretSantaId, ...values });
  }

  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label={t("ideaCreateAction")} />}
      title={t("ideaCreateTitle")}
      description={t("ideaCreateDescription")}
    >
      <GiftIdeaForm
        initialValues={{ name: "", description: "", url: "" }}
        submitText={tCommon("create")}
        submitIcon={<PlusIcon />}
        errorText={t("ideaCreateError")}
        onSubmit={handleCreate}
      />
    </ModalForm>
  );
}

function GiftIdeaItem({ giftIdea }: { giftIdea: GiftIdea }) {
  const update = useMutation(api.secretSantas.updateGiftIdea);
  const remove = useMutation(api.secretSantas.removeGiftIdea);
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");
  const giftIdeaId = giftIdea.id as Id<"secretSantaGiftIdeas">;

  async function handleEdit(values: GiftIdeaValues) {
    await update({ giftIdeaId, ...values });
  }

  async function handleDelete() {
    try {
      await remove({ giftIdeaId });
    } catch (error) {
      captureException(error, { action: "delete_gift_idea" });
      toast.error(t("ideaDeleteError"));
    }
  }

  return (
    <Item variant="card">
      <GiftIdeaContent giftIdea={giftIdea} />
      <ItemActions>
        <ModalForm
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("ideaEditTitle")}
            >
              <PencilIcon />
            </Button>
          }
          title={t("ideaEditTitle")}
          description={t("ideaEditDescription", { name: giftIdea.name })}
        >
          <GiftIdeaForm
            initialValues={{
              name: giftIdea.name,
              description: giftIdea.description ?? "",
              url: giftIdea.url ?? "",
            }}
            submitText={tCommon("save")}
            submitIcon={<PencilIcon />}
            errorText={t("ideaSaveError")}
            onSubmit={handleEdit}
          />
        </ModalForm>

        <ModalAction
          title={t("ideaDeleteTitle")}
          description={t("ideaDeleteDescription")}
          actionText={tCommon("delete")}
          onAction={handleDelete}
          variant="destructive"
          trigger={
            <Button
              variant="ghostDestructive"
              size="icon-sm"
              aria-label={t("ideaDeleteTitle")}
            >
              <TrashIcon />
            </Button>
          }
        />
      </ItemActions>
    </Item>
  );
}
