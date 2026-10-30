"use client";

import { Edit, Settings, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import { UnreadBadge, UnreadDot } from "@/components/unread-badge";
import { Link } from "@/i18n/navigation";
import { unreadCount } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";
import { useSession } from "@/lib/session";
import DeleteProjectButton from "../_components/delete-project-button";
import UsersList from "../_components/users-list";
import EditProjectButton from "./edit-project-button";
import InviteButton from "./invite-button";
import LeaveButton from "./leave-button";

export default function ProjectsTable() {
  const { projects } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const unread = useUnreadNotifications();
  function deleteButton(project: Project) {
    if (project.createdBy !== session?.user.id) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="ghost"
                size="icon"
                disabled
                aria-label={tCommon("delete")}
              >
                <Trash2 />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("deleteRestrictionCreatorOnly")}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <DeleteProjectButton projectId={project.id} />;
  }

  function editButton(project: Project) {
    if (project.createdBy !== session?.user.id) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                disabled
                variant="ghost"
                size="icon"
                aria-label={tCommon("edit")}
              >
                <Edit />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("editRestrictionCreatorOnly")}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <EditProjectButton project={project} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("groupColumn")}</TableHead>
          <TableHead>{tCommon("users")}</TableHead>
          <TableHead className="text-right">{tCommon("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow
            key={project.id}
            className="hover:bg-accent [&_.avatar]:transition-colors hover:[&_.avatar]:border-accent"
          >
            <TableCell>
              <Link
                href={{
                  pathname: "/groups/[projectId]",
                  params: { projectId: project.id },
                }}
                className="inline-flex items-center gap-2"
              >
                {project.name}
                <UnreadBadge count={unreadCount(unread, project.id)} />
              </Link>
            </TableCell>
            <TableCell className="align-middle">
              <UsersList users={project.users} />
            </TableCell>
            <TableCell className="align-middle">
              <div className="flex flex-row items-center justify-end gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={{
                      pathname: "/groups/[projectId]/settings",
                      params: { projectId: project.id },
                    }}
                    aria-label={t("manageTitle")}
                    className="relative"
                  >
                    <Settings />
                    <UnreadDot
                      count={unreadCount(unread, project.id, "members")}
                      className="absolute top-1.5 right-1.5"
                    />
                  </Link>
                </Button>
                <InviteButton project={project} />
                <LeaveButton project={project} />
                {editButton(project)}
                {deleteButton(project)}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
