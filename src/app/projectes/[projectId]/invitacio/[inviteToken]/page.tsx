import Redirect from "@/app/_components/home-redirect";
import UsersList from "@/app/projectes/_components/users-list";
import { auth } from "@/auth";
import { getInvitedProject } from "@/server/projects";
import { ArrowLeft } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvite } from "./actions";

export default async function InvitePage({
  params: { projectId, inviteToken },
}: {
  params: { projectId: string; inviteToken: string };
}) {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  const project = await getInvitedProject(projectId);

  if (project?.users.some((user) => user.user.id === session.user.id)) {
    // Already joined
    return <Redirect projectId={projectId} />;
  }

  if (project?.inviteToken !== inviteToken) {
    return (
      <div className="space-y-4">
        <div className="alert alert-error mx-auto my-12 max-w-sm">
          Invitació invàlida
        </div>

        <Link href="/" className="btn btn-neutral">
          <ArrowLeft /> Tornar a la pàgina principal
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="card bg-primary text-primary-content shadow-xl">
        <div className="card-body">
          <h1 className="mb-4 text-xl font-semibold">
            Invitació al projecte{" "}
            <span className="font-bold text-secondary">{project.name}</span>
          </h1>

          <div className="flex flex-row items-center gap-4">
            Participants: <UsersList users={project.users} />
          </div>

          <div className="card-actions mt-4 justify-end">
            <form
              action={async () => {
                "use server";
                try {
                  await acceptInvite(projectId, inviteToken);
                  revalidatePath(
                    `/projectes/${projectId}/invitacio/${inviteToken}`,
                  );
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              <button className="btn btn-neutral">Acceptar invitació</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
