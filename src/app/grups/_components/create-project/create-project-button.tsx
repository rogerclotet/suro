"use client";

import { PlusIcon } from "lucide-react";
import Action from "@/components/action";
import CreateProjectForm from "./create-project-form";

export default function CreateProjectButton() {
  return (
    <CreateProjectForm
      trigger={<Action icon={PlusIcon} label="Crear grup" />}
    />
  );
}
