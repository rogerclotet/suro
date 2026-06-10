"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { usePot } from "@/lib/queries/use-expenses";
import CreateSpendingButton from "../../_components/create-spending-button/create-spending-button";
import SettleButton from "../../_components/settle-button/settle-button";
import SpendingsList from "../../_components/spendings-list";
import SpendingsTable from "../../_components/spendings-table";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-xl">{pot.name}</h1>
          {pot.settledAt && (
            <Badge variant="secondary">{t("potSettled")}</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SettleButton
            spendings={pot.spendings}
            members={pot.users}
            potId={pot.id}
          />
          <CreateSpendingButton members={pot.users} pot={pot} />
        </div>
      </div>

      <SpendingsTable spendings={pot.spendings} members={pot.users} />

      <h2 className="font-semibold text-lg">{t("lastTransactions")}</h2>
      <SpendingsList spendings={pot.spendings} />
    </div>
  );
}
