import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFlags } from "@/server/flags";
import { getUserProject } from "@/server/projects";
import { getCurrentSecretSanta } from "@/server/secret-santa";
import CreateButton from "./_components/secret-santa/setup/create-button";
import SecretSantaSetup from "./_components/secret-santa/setup/setup";
import SecretSantaStarted from "./_components/secret-santa/started/started";

export default async function AmicInvisiblePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const flags = await getFlags();
  if (!flags.amicInvisible) {
    redirect("/");
  }

  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const { projectId } = await params;
  const project = await getUserProject(projectId);
  if (!project) {
    redirect("/");
  }

  const t = await getTranslations("secretSanta");
  const tCommon = await getTranslations("common");

  if (project.users.length < 2) {
    return (
      <Alert className="mx-auto max-w-lg">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{tCommon("info")}</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{t("infoDescription")}</p>
          <p>{t("description")}</p>
        </AlertDescription>
      </Alert>
    );
  }

  const isAdmin = project.createdBy === session.user.id;

  const secretSanta = await getCurrentSecretSanta(projectId);
  if (!secretSanta) {
    return (
      <>
        <Alert className="mx-auto max-w-lg">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>{t("emptyTitle")}</AlertTitle>
          <AlertDescription>
            {isAdmin ? t("emptyAdminMessage") : t("emptyNonAdminMessage")}
          </AlertDescription>
        </Alert>

        {isAdmin && <CreateButton />}
      </>
    );
  }

  if (secretSanta.assignmentsDone) {
    return <SecretSantaStarted secretSanta={secretSanta} />;
  }

  return <SecretSantaSetup secretSanta={secretSanta} />;
}
