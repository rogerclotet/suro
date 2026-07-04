"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePot } from "@/lib/queries/use-expenses";
import CreateSpendingButton from "../../_components/create-spending-button/create-spending-button";
import SettleButton from "../../_components/settle-button/settle-button";
import SpendingsList from "../../_components/spendings-list";
import SpendingsTable from "../../_components/spendings-table";
import DeletePotModal from "./delete-pot-modal";

export default function PotDetailView({
  potId,
}: {
  projectId: string;
  potId: string;
}) {
  const t = useTranslations("expenses");
  const pot = usePot(potId);

  if (pot === undefined || pot === null) {
    return null;
  }

  // Only settled or not-yet-started (no spendings) pots can be removed, so an
  // in-progress pot's recorded expenses can't be lost. Mirrors the backend.
  const deletable = pot.settledAt !== null || pot.spendings.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-xl">{pot.name}</h1>
          {pot.settledAt && (
            // Muted bordered chip, like mobile's settled marker.
            <Badge variant="outline" className="text-muted-foreground">
              {t("potSettled")}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SettleButton
            spendings={pot.spendings}
            members={pot.users}
            potId={pot.id}
          />
          <CreateSpendingButton members={pot.users} pot={pot} />
          {deletable && (
            <DeletePotModal
              pot={{ id: pot.id, name: pot.name, projectId: pot.projectId }}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("deletePot")}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              }
            />
          )}
        </div>
      </div>

      <SpendingsTable spendings={pot.spendings} members={pot.users} />

      <h2 className="font-semibold text-lg">{t("lastTransactions")}</h2>
      <SpendingsList spendings={pot.spendings} />
    </div>
  );
}
