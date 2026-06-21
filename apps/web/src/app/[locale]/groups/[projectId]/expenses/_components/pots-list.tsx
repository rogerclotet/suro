"use client";

import { ChevronDown, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useProjects } from "@/app/_state/project-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  type PotsOverview,
  useProjectPotsOverview,
} from "@/lib/queries/use-expenses";
import CreatePotButton from "./create-pot-button/create-pot-button";
import PotPreview from "./pot-preview";

// Settled pots pile up once a trip is over: show the latest page and grow it in
// place behind "show more". Mirrors the lists overview's completed pagination.
const SETTLED_PAGE_SIZE = 5;

export default function PotsList({ projectId }: { projectId: string }) {
  const { project } = useProjects();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const [settledLimit, setSettledLimit] = useState(SETTLED_PAGE_SIZE);
  const overview = useStable(useProjectPotsOverview(projectId, settledLimit));

  if (project && project.users.length === 1) {
    return (
      <Alert className="mx-auto max-w-lg">
        <Info className="h-4 w-4" />
        <AlertTitle>{tCommon("info")}</AlertTitle>
        <AlertDescription>{t("infoDescription")}</AlertDescription>
      </Alert>
    );
  }

  if (overview === undefined) {
    return null;
  }

  const isEmpty = overview.active.length === 0 && overview.settled.length === 0;

  return (
    <div className="space-y-6">
      <CreatePotButton />

      {isEmpty ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>{t("noPotsTitle")}</p>
          <p className="text-sm">{t("noPotsHint")}</p>
        </div>
      ) : (
        <>
          {overview.active.length > 0 && (
            <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
              {overview.active.map((pot) => (
                <PotPreview key={pot.id} pot={pot} projectId={projectId} />
              ))}
            </div>
          )}

          {overview.settled.length > 0 && (
            <>
              <h2 className="font-semibold text-lg">{t("settled")}</h2>
              <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
                {overview.settled.map((pot) => (
                  <PotPreview key={pot.id} pot={pot} projectId={projectId} />
                ))}
              </div>
              {overview.hasMoreSettled && (
                <button
                  type="button"
                  onClick={() =>
                    setSettledLimit((limit) => limit + SETTLED_PAGE_SIZE)
                  }
                  className="flex w-full items-center justify-center gap-1.5 py-3 text-muted-foreground transition-opacity hover:opacity-70"
                >
                  <ChevronDown size={16} />
                  <span className="font-bold text-[13px]">
                    {t("showMoreSettled")}
                  </span>
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// Holds the last loaded overview while the query re-runs with a larger limit
// (Convex returns undefined during the swap), so "show more" grows the settled
// grid in place instead of flashing the page empty.
function useStable(value: PotsOverview | undefined): PotsOverview | undefined {
  const last = useRef<PotsOverview | undefined>(undefined);
  if (value !== undefined) {
    last.current = value;
  }
  return last.current;
}
