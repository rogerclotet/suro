import Redirect from "@/app/_components/redirect";
import UsersList from "@/app/grups/_components/users-list";
import { auth } from "@/auth";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkAuth } from "@/lib/check-auth";
import { getInvitedProject } from "@/server/projects";
import assert from "assert";
import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { Logger } from "next-axiom";
import { revalidatePath } from "next/cache";
import { acceptInvite } from "./actions";

type Props = {
  params: { projectId: string; inviteToken: string };
};

export default async function InvitePage({
  params: { projectId, inviteToken },
}: Props) {
  await checkAuth();

  const session = await auth();
  assert(session, "Unauthenticated user");

  const log = new Logger();

  const project = await getInvitedProject(projectId);

  if (project?.users.some((user) => user.user.id === session.user.id)) {
    // Already joined
    return <Redirect project={project} />;
  }

  if (project?.inviteToken !== inviteToken) {
    return (
      <Alert variant="destructive" className="mx-auto mt-20 max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Invitació invàlida</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="mt-20 flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>
            Invitació al grup{" "}
            <span className="font-bold text-secondary">{project.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row items-center gap-4">
            Participants: <UsersList users={project.users} />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <form
            action={async () => {
              "use server";
              try {
                await acceptInvite(projectId, inviteToken);
                revalidatePath(`/grups/${projectId}/invitacio/${inviteToken}`);
              } catch (e) {
                log.error("Error accepting invite", { error: e, projectId });
                await log.flush();
              }
            }}
          >
            <Button>Acceptar invitació</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getInvitedProject(params.projectId);

  if (!project) {
    return {};
  }

  return {
    title: `${project.name}`,
    description: `Invitació per unir-se al grup ${project.name}`,
  };
}
