import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { getPathname } from "@/i18n/navigation";
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
  const t = await getTranslations("expenses");

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
    const locale = await getLocale();
    redirect(
      getPathname({
        href: {
          pathname: "/groups/[projectId]/expenses",
          params: { projectId },
        },
        locale,
      }),
    );
  }

  const potSpendings = await getPotSpendings(potId);
  const potMembers = pot!.users;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-xl">{pot!.name}</h1>
          {pot!.settledAt && (
            <Badge variant="secondary">{t("potSettled")}</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SettleButton
            spendings={potSpendings}
            members={potMembers}
            potId={potId}
          />
          <CreateSpendingButton members={potMembers} pot={pot!} />
        </div>
      </div>

      <SpendingsTable spendings={potSpendings} members={potMembers} />

      <h2 className="font-semibold text-lg">{t("lastTransactions")}</h2>
      <SpendingsList spendings={potSpendings} />
    </div>
  );
}
