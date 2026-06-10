"use client";

import { Edit, Trash2 } from "lucide-react";
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
import { Link } from "@/i18n/navigation";
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
  const ownProjects = projects.filter(
    (p) => p.createdBy === session?.user.id,
  ).length;

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

    if (project.users.length > 1) {
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
            <p>{t("deleteRestrictionEmptyOnly")}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (ownProjects <= 1) {
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
            <p>{t("deleteRestrictionOnlyOwn")}</p>
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
            className="hover:bg-card [&_.avatar]:transition-colors hover:[&_.avatar]:border-card"
          >
            <TableCell>
              <Link
                href={{
                  pathname: "/groups/[projectId]",
                  params: { projectId: project.id },
                }}
              >
                {project.name}
              </Link>
            </TableCell>
            <TableCell className="align-middle">
              <UsersList users={project.users} />
            </TableCell>
            <TableCell className="align-middle">
              <div className="flex flex-row items-center justify-end gap-1">
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
