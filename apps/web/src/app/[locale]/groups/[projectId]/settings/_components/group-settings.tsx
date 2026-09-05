"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  adaptProject,
  type Project,
  type ProjectMember,
} from "@/app/_data/project";
import DeleteProjectButton from "@/app/[locale]/groups/_components/delete-project-button";
import EditProjectButton from "@/app/[locale]/groups/_components/edit-project-button";
import InviteButton from "@/app/[locale]/groups/_components/invite-button";
import LeaveButton from "@/app/[locale]/groups/_components/leave-button";
import ProjectAvatar from "@/components/project-avatar";
import { Button } from "@/components/ui/button";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import UserAvatar from "@/components/user-avatar";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/session";

export default function GroupSettings({ projectId }: { projectId: string }) {
  const { isAuthenticated } = useConvexAuth();
  const data = useQuery(
    api.projects.listMineDetailed,
    isAuthenticated ? {} : "skip",
  );
  const { data: session } = useSession();
  const t = useTranslations("groups");
  if (data === undefined)
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner" />
      </div>
    );
  const row = data.find((p) => p._id === projectId);
  const project = row ? adaptProject(row) : null;
  if (!project)
    return (
      <div className="space-y-4">
        <p>{t("groupUnavailable")}</p>
        <Link href="/groups">{t("backToGroups")}</Link>
      </div>
    );
  const isAdmin = project.createdBy === session?.user.id;
  return (
    <div className="mx-auto w-full max-w-xl space-y-8 py-4">
      <div className="flex items-center gap-4">
        <ProjectAvatar project={project} className="size-14 text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="break-words font-display font-semibold text-2xl">
            {project.name}
          </h1>
          <p className="text-muted-foreground">{t("manageTitle")}</p>
        </div>
        {isAdmin ? <EditProjectButton project={project} /> : null}
        <InviteButton project={project} />
      </div>
      <section className="space-y-2">
        <h2 className="font-display font-semibold text-lg">
          {t("membersTitle")}
        </h2>
        <ul className="divide-y divide-border">
          {project.users.map(({ user }) => (
            <li key={user.id} className="flex items-center gap-3 py-3">
              <UserAvatar user={user} />
              <span className="min-w-0 flex-1 break-words">
                {user.name ?? t("unnamedMember")}
              </span>
              {user.id === project.createdBy ? (
                <span className="text-muted-foreground text-sm">
                  {t("administrator")}
                </span>
              ) : isAdmin ? (
                <RemoveMemberButton project={project} user={user} />
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <div className="border-border border-t pt-4">
        {isAdmin ? (
          <DeleteProjectButton projectId={project.id} showLabel />
        ) : (
          <LeaveButton project={project} />
        )}
      </div>
    </div>
  );
}

function RemoveMemberButton({
  project,
  user,
}: {
  project: Project;
  user: ProjectMember["user"];
}) {
  const t = useTranslations("groups");
  const name = user.name ?? t("unnamedMember");
  return (
    <ModalForm
      title={t("removeMember")}
      description={t("removeMemberDescription", { name })}
      trigger={
        <Button
          variant="ghostDestructive"
          size="sm"
          aria-label={t("removeMemberLabel", { name })}
        >
          {t("removeMember")}
        </Button>
      }
    >
      <RemoveMemberForm project={project} user={user} />
    </ModalForm>
  );
}

function RemoveMemberForm({
  project,
  user,
}: {
  project: Project;
  user: ProjectMember["user"];
}) {
  const t = useTranslations("groups");
  const tc = useTranslations("common");
  const { close } = useModalForm();
  const remove = useMutation(api.projects.removeMember);
  const [busy, setBusy] = useState(false);
  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      await remove({
        projectId: project.id as Id<"projects">,
        userId: user.id as Id<"users">,
      });
      close();
      toast.success(
        t("removeMemberSuccess", { name: user.name ?? t("unnamedMember") }),
      );
    } catch {
      toast.error(t("removeMemberError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={close} disabled={busy}>
        {tc("cancel")}
      </Button>
      <Button
        variant="destructive"
        onClick={() => void confirm()}
        disabled={busy}
      >
        {busy ? t("working") : t("removeMember")}
      </Button>
    </div>
  );
}
