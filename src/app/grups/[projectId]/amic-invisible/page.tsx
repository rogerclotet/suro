import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFlags } from "@/server/flags";
import { getUserProject } from "@/server/projects";
import { getCurrentSecretSanta } from "@/server/secret-santa";
import SecretSanta from "./_components/secret-santa";
import CreateSecretSantaForm from "./create-secret-santa-form";

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

  if (project.users.length === 1) {
    return (
      <Alert className="mx-auto max-w-lg">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Informació</AlertTitle>
        <AlertDescription>
          {"Per crear un amic invisible el grup ha de tenir més d'un usuari."}
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

        {isAdmin && <CreateSecretSantaForm project={project} />}
      </>
    );
  }

  return <SecretSanta secretSanta={secretSanta} />;
}
