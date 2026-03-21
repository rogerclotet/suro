import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { getPot, getPotSpendings } from "@/server/pots";
import { getUserProject } from "@/server/projects";
import CreateSpendingButton from "../_components/create-spending-button/create-spending-button";
import SettleButton from "../_components/settle-button/settle-button";
import SpendingsList from "../_components/spendings-list";
import SpendingsTable from "../_components/spendings-table";

export default async function PotPage({
  params,
}: {
  params: Promise<{ projectId: string; potId: string }>;
}) {
  const { projectId, potId } = await params;

  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const project = await getUserProject(projectId);
  if (!project) {
    redirect("/");
  }

  const pot = await getPot(potId);
  if (!pot || pot.projectId !== projectId) {
    redirect(`/grups/${projectId}/despeses`);
  }

  const potSpendings = await getPotSpendings(potId);
  const potMembers = pot.users;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-xl">{pot.name}</h1>
          {pot.settledAt && <Badge variant="secondary">Saldat</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SettleButton
            spendings={potSpendings}
            members={potMembers}
            potId={potId}
          />
          <CreateSpendingButton members={potMembers} potId={potId} />
        </div>
      </div>

      <SpendingsTable spendings={potSpendings} members={potMembers} />

      <h2 className="font-semibold text-lg">Últimes transaccions</h2>
      <SpendingsList spendings={potSpendings} />
    </div>
  );
}
