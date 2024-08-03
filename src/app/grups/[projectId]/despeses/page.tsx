import { checkAuth } from "@/lib/check-auth";
import { getProjectSpendings } from "@/server/spendings";
import CreateSpendingButton from "./_components/create-spending-button/create-spending-button";
import SpendingsList from "./_components/spendings-list";
import SpendingsTable from "./_components/spendings-table";

export default async function DespesesPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  await checkAuth();

  const projectSpendings = await getProjectSpendings(projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="mt-1 text-xl font-semibold">Despeses</h1>
        <CreateSpendingButton />
      </div>

      <SpendingsTable spendings={projectSpendings} />

      <h2 className="text-lg font-semibold">Últimes transaccions</h2>
      <SpendingsList spendings={projectSpendings} />
    </div>
  );
}
