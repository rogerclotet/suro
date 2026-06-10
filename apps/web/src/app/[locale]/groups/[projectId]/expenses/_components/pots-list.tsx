"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useProjects } from "@/app/_state/project-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProjectPots } from "@/lib/queries/use-expenses";
import CreatePotButton from "./create-pot-button/create-pot-button";
import PotPreview from "./pot-preview";

export default function PotsList({ projectId }: { projectId: string }) {
  const { project } = useProjects();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const pots = useProjectPots(projectId);

  if (project && project.users.length === 1) {
    return (
      <Alert className="mx-auto max-w-lg">
        <Info className="h-4 w-4" />
        <AlertTitle>{tCommon("info")}</AlertTitle>
        <AlertDescription>{t("infoDescription")}</AlertDescription>
      </Alert>
    );
  }

  if (pots === undefined) {
    return null;
  }

  const activePots = pots.filter((p) => p.settledAt === null);
  const archivedPots = pots.filter((p) => p.settledAt !== null);

  return (
    <div className="space-y-6">
      <CreatePotButton />

      {pots.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>{t("noPotsTitle")}</p>
          <p className="text-sm">{t("noPotsHint")}</p>
        </div>
      ) : (
        <>
          {activePots.length > 0 && (
            <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
              {activePots.map((pot) => (
                <PotPreview key={pot.id} pot={pot} projectId={projectId} />
              ))}
            </div>
          )}

          {archivedPots.length > 0 && (
            <>
              <h2 className="font-semibold text-lg">{t("settled")}</h2>
              <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
                {archivedPots.map((pot) => (
                  <PotPreview key={pot.id} pot={pot} projectId={projectId} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
