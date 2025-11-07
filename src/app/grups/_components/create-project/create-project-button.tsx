"use client";

import { PlusIcon } from "lucide-react";
import { useRef } from "react";
import Action from "@/components/action";
import CreateProjectForm from "../../_components/create-project/create-project-form";

export default function CreateProjectButton() {
  const modalRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Action
        icon={PlusIcon}
        label="Crear grup"
        onClick={() => modalRef.current?.click()}
      />

      <CreateProjectForm triggerRef={modalRef} />
    </>
  );
}
