import { Info } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUserProject } from "@/server/projects";
import { getProjectSpendings } from "@/server/spendings";
import CreateSpendingButton from "./_components/create-spending-button/create-spending-button";
import SettleButton from "./_components/settle-button/settle-button";
import SpendingsList from "./_components/spendings-list";
import SpendingsTable from "./_components/spendings-table";

export default async function DespesesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const project = await getUserProject(projectId);
  if (!project) {
    redirect("/");
  }

  if (project.users.length === 1) {
    return (
      <Alert className="mx-auto max-w-lg">
        <Info className="h-4 w-4" />
        <AlertTitle>Informació</AlertTitle>
        <AlertDescription>
          {`Aquesta secció està dissenyada per grups amb més d'un usuari,
              i permet compartir despeses i calcular els pagaments que es fan en grup.`}
        </AlertDescription>
      </Alert>
    );
  }

  const projectSpendings = await getProjectSpendings(projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SettleButton spendings={projectSpendings} />
        {/* TODO Move to sidebar */}
        <CreateSpendingButton />
      </div>

      <SpendingsTable spendings={projectSpendings} />

      <h2 className="font-semibold text-lg">Últimes transaccions</h2>
      <SpendingsList spendings={projectSpendings} />
    </div>
  );
}
