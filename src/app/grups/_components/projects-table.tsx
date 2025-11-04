import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
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
import { getProjects } from "@/server/projects";
import DeleteProjectButton from "../_components/delete-project-button";
import UsersList from "../_components/users-list";
import EditProjectButton from "./edit-project-button";
import IdIcon from "./id-icon";
import InviteButton from "./invite-button";
import LeaveButton from "./leave-button";

export default async function ProjectsTable() {
  const session = await auth();
  const projects = await getProjects();
  const ownProjects = projects.filter(
    (p) => p.createdBy === session?.user.id,
  ).length;

  async function DeleteButton({ project }: { project: Project }) {
    if (project.createdBy !== session?.user.id) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="ghost"
                size="icon"
                disabled
                aria-label="Eliminar"
              >
                <Trash2 />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{"Només el creador pot eliminar aquest grup"}</p>
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
                aria-label="Eliminar"
              >
                <Trash2 />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{"Només es poden eliminar els grups buits"}</p>
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
                aria-label="Eliminar"
              >
                <Trash2 />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{"No es pot eliminar l'únic grup propi"}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <DeleteProjectButton projectId={project.id} />;
  }

  async function EditButton({ project }: { project: Project }) {
    if (project.createdBy !== session?.user.id) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button disabled variant="ghost" size="icon" aria-label="Editar">
                <Edit />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{"Només el creador pot editar aquest grup"}</p>
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
          <TableHead>ID</TableHead>
          <TableHead>Grup</TableHead>
          <TableHead>Usuaris</TableHead>
          <TableHead className="text-right">Accions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow
            key={project.id}
            className="hover:bg-card [&_.avatar]:transition-colors hover:[&_.avatar]:border-card"
          >
            <TableCell>
              <IdIcon id={project.id} />
            </TableCell>
            <TableCell>
              <Link href={`/grups/${project.id}`}>{project.name}</Link>
            </TableCell>
            <TableCell className="p-0">
              <UsersList users={project.users} />
            </TableCell>
            <TableCell className="flex flex-row items-center justify-end gap-1">
              <InviteButton project={project} />
              <LeaveButton project={project} />
              <EditButton project={project} />
              <DeleteButton project={project} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
