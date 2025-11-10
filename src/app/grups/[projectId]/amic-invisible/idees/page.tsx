import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentSecretSanta } from "@/server/secret-santa";
import GiftIdeas from "./gift-ideas";

export default async function IdeasPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const secretSanta = await getCurrentSecretSanta(projectId);
  if (!secretSanta) {
    redirect(`/grups/${projectId}/amic-invisible`);
  }

  const participant = secretSanta.participants.find(
    (p) => p.userId === session.user.id,
  );
  if (!participant) {
    redirect(`/grups/${projectId}/amic-invisible`);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-2xl">{"Llista d'idees"}</h2>

      <GiftIdeas
        giftIdeas={participant.giftIdeas}
        secretSantaId={secretSanta.id}
      />
    </div>
  );
}
