import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import Redirect from "@/app/_components/redirect";
import UsersList from "@/app/[locale]/groups/_components/users-list";
import Login from "@/app/[locale]/login/_components/login";
import { auth } from "@/auth";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pathnameHeader } from "@/proxy";
import { getProjectByInvite } from "@/server/projects";
import AcceptInviteButton from "./_components/accept-invite-button/accept-invite-button";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ projectId: string; inviteToken: string }>;
}) {
  const { projectId, inviteToken } = await params;

  const session = await auth();
  const t = await getTranslations("invitation");

  const project = await getProjectByInvite(projectId, inviteToken);

  if (!project) {
    return (
      <Alert variant="destructive" className="mx-auto mt-20 max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("invalidTitle")}</AlertTitle>
      </Alert>
    );
  }

  if (
    session?.user &&
    project.users.some((u) => u.user.id === session.user.id)
  ) {
    // Already joined
    return <Redirect project={project} />;
  }

  const redirectTo = (await headers()).get(pathnameHeader) ?? undefined;

  return (
    <div className="mt-20 flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>
            {t("groupTitle")}{" "}
            <span className="font-bold text-secondary">{project.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row items-center gap-4">
            {t("participants")} <UsersList users={project.users} />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          {session ? (
            <div className="flex justify-center">
              <AcceptInviteButton
                projectId={projectId}
                inviteToken={inviteToken}
              />
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground text-sm">
                {t("loginPrompt")}
              </p>
              <Login redirectTo={redirectTo} compact />
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("invitation");

  return {
    title: t("metadataInviteTitle"),
    description: t("metadataInviteBody"),
    robots: { index: false, follow: false },
  };
}
