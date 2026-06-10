"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Action from "@/components/action";
import CreateProjectForm from "./create-project-form";

export default function CreateProjectButton() {
  const t = useTranslations("groups");
  return (
    <CreateProjectForm
      trigger={<Action icon={PlusIcon} label={t("createTitle")} />}
    />
  );
}
