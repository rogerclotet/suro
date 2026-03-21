import { Info } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getProjectPots } from "@/server/pots";
import { getUserProject } from "@/server/projects";
import CreatePotButton from "./_components/create-pot-button/create-pot-button";
import PotPreview from "./_components/pot-preview";

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

  const pots = await getProjectPots(projectId);

  const activePots = pots.filter((p) => p.settledAt === null);
  const archivedPots = pots.filter((p) => p.settledAt !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <CreatePotButton />
      </div>

      {pots.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p>No hi ha cap pot.</p>
          <p className="text-sm">
            Crea un pot per començar a compartir despeses.
          </p>
        </div>
      ) : (
        <>
          {activePots.length > 0 && (
            <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
              {activePots.map((pot) => (
                <PotPreview key={pot.id} pot={pot} projectId={projectId} />
              ))}
            </div>
          )}

          {archivedPots.length > 0 && (
            <>
              <h2 className="font-semibold text-lg">Saldats</h2>
              <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
                {archivedPots.map((pot) => (
                  <PotPreview key={pot.id} pot={pot} projectId={projectId} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
