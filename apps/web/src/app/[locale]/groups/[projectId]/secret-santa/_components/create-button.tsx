"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Project } from "@/app/_data/project";
import Action from "@/components/action";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import { captureException } from "@/lib/error-reporting";
import { secretSantaErrorMessage } from "./errors";
import {
  exchangeFromValues,
  newSecretSantaValues,
  type SecretSantaFormValues,
} from "./form-values";
import SecretSantaForm from "./secret-santa-form";

export default function CreateButton({ project }: { project: Project }) {
  const t = useTranslations("secretSanta");

  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label={t("createAction")} />}
      title={t("createTitle")}
      description={t("createDescription", { projectName: project.name })}
    >
      <CreateForm project={project} />
    </ModalForm>
  );
}

function CreateForm({ project }: { project: Project }) {
  const { close } = useModalForm();
  const create = useMutation(api.secretSantas.create);
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");

  async function handleSubmit(values: SecretSantaFormValues) {
    try {
      await create({
        projectId: project.id as Id<"projects">,
        name: values.name,
        description: values.description,
        ...exchangeFromValues(values),
        priceRange: values.priceRange,
        participantIds: values.participantIds as Id<"users">[],
      });
      toast.success(t("createSuccess"));
      close();
    } catch (error) {
      const message = secretSantaErrorMessage(error, t);
      if (message === null) {
        captureException(error, { action: "create_secret_santa" });
      }
      toast.error(message ?? t("createError"));
    }
  }

  return (
    <SecretSantaForm
      initialValues={newSecretSantaValues(
        t("defaultName", { year: new Date().getFullYear() }),
        project.users.map(({ user }) => user.id),
      )}
      members={project.users}
      requireUpcoming
      submitText={tCommon("create")}
      submitIcon={<PlusIcon />}
      onSubmit={handleSubmit}
    />
  );
}
