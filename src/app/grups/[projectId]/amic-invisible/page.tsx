import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFlags } from "@/server/flags";
import { getUserProject } from "@/server/projects";
import { getCurrentSecretSanta } from "@/server/secret-santa";
import CreateButton from "./_components/secret-santa/setup/create-button";
import SecretSantaSetup from "./_components/secret-santa/setup/setup";
import SecretSantaStarted from "./_components/secret-santa/started/started";

const description =
  "L'amic invisible consisteix en fer un sorteig on a cada persona se li assigna un altre participant de forma aleatòria, i aquest li prepararà un regal, de manera que no se sap qui li ha fet a qui.";

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

  if (project.users.length < 3) {
    return (
      <Alert className="mx-auto max-w-lg">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Informació</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            {
              "Aquesta secció està pensada per grups de 3 o més persones, i permet fer un amic invisible entre ells."
            }
          </p>
          <p>{description}</p>
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
          <AlertTitle>
            {"Encara no s'ha fet cap amic invisible en aquest grup."}
          </AlertTitle>
          <AlertDescription>
            {isAdmin
              ? "Pots crear-ne un i decidir quins participants incloure, si posar exclusions, i altres detalls."
              : "L'administrador del grup en pot crear un."}
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
