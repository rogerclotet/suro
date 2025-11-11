"use client";

import { ArchiveIcon, Edit, SaveIcon, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useRef } from "react";
import { toast } from "sonner";
import type { SecretSanta, SecretSantaData } from "@/app/_data/secret-santa";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ModalAction from "@/components/ui/modal-action";
import ModalForm from "@/components/ui/modal-form";
import { archiveSecretSanta, updateSecretSanta } from "@/server/secret-santa";
import SecretSantaForm from "../../form";

export default function SettingsMenu({
  secretSanta,
}: {
  secretSanta: SecretSanta;
}) {
  const { data: session } = useSession();
  const editDialogRef = useRef<HTMLDivElement>(null);

  async function handleEdit(data: SecretSantaData) {
    try {
      await updateSecretSanta(secretSanta, data);
      editDialogRef.current?.click();
      toast.success("Amic Invisible actualitzat correctament");
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "edit_secret_santa",
        projectId: secretSanta.projectId,
      });
      toast.error(
        "No s'ha pogut editar l'Amic Invisible, torna-ho a provar més tard",
      );
    }
  }

  async function handleArchive() {
    try {
      await archiveSecretSanta(secretSanta);
      toast.success("Amic Invisible arxivat correctament");
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "archive_secret_santa",
        projectId: secretSanta.projectId,
      });
      toast.error(
        "No s'ha pogut arxivar l'Amic Invisible, torna-ho a provar més tard",
      );
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <ModalForm
          title="Editar Amic Invisible"
          description={`Editar ${secretSanta.name}`}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              ref={editDialogRef}
              className="cursor-pointer gap-2"
            >
              <Edit />
              Editar Amic Invisible
            </DropdownMenuItem>
          }
        >
          <SecretSantaForm
            initialData={getSecretSantaData(secretSanta)}
            assignmentsDone={secretSanta.assignmentsDone}
            onChange={handleEdit}
            submitText="Desar"
            submitIcon={<SaveIcon />}
          />
        </ModalForm>

        <ModalAction
          title="Arxivar Amic Invisible"
          description="Estàs segur que vols arxivar l'Amic Invisible?"
          actionText="Arxivar Amic Invisible"
          onAction={handleArchive}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <ArchiveIcon />
              Arxivar Amic Invisible
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getSecretSantaData(secretSanta: SecretSanta): SecretSantaData {
  return {
    name: secretSanta.name,
    description: secretSanta.description,
    priceRange: secretSanta.priceRange,
    datetime: secretSanta.datetime,
    participants: secretSanta.participants.map(
      (participant) => participant.userId,
    ),
  };
}
