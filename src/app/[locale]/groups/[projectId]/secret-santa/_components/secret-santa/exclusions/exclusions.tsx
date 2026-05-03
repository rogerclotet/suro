"use client";

import { SquaresExcludeIcon } from "lucide-react";
import { useRef } from "react";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import ModalForm from "@/components/ui/modal-form";
import { Separator } from "@/components/ui/separator";
import CreateExclusionForm from "./create-exclusion-form";
import ExclusionList from "./exclusion-list";

export default function Exclusions({
  secretSanta,
}: {
  secretSanta: SecretSanta;
}) {
  const { isAdmin } = useProjects();
  if (isAdmin) {
    return <AdminExclusions secretSanta={secretSanta} />;
  }

  if (secretSanta.exclusions.length === 0) {
    return null;
  }

  return (
    <ExclusionsLayout>
      <ExclusionList secretSanta={secretSanta} />
    </ExclusionsLayout>
  );
}

function AdminExclusions({ secretSanta }: { secretSanta: SecretSanta }) {
  const maxExclusions = Math.floor(secretSanta.participants.length / 2);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <ExclusionsLayout>
      <ExclusionList secretSanta={secretSanta} />

      <ModalForm
        trigger={
          <Button ref={triggerRef}>
            <SquaresExcludeIcon /> Nova exclusió
          </Button>
        }
        title="Nova exclusió"
        description={`Per crear una exclusió, selecciona ${maxExclusions > 2 ? `entre 2 i ${Math.floor(secretSanta.participants.length / 2)}` : "2"} participants. Aquests no podran ser assignats entre ells.`}
      >
        <CreateExclusionForm
          secretSanta={secretSanta}
          onClose={() => triggerRef.current?.click()}
        />
      </ModalForm>
    </ExclusionsLayout>
  );
}

function ExclusionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Separator />

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Exclusions</h3>
        <p className="text-muted-foreground text-sm">
          {
            "Les exclusions són parelles de participants que no poden ser assignats entre ells."
          }
        </p>
      </div>

      {children}
    </>
  );
}
