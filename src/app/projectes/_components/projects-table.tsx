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
} from "@/components/ui/tooltip";
import { getProjects } from "@/server/projects";
import { Edit, Trash2 } from "lucide-react";
import DeleteProjectButton from "../_components/delete-project-button";
import UsersList from "../_components/users-list";
import IdIcon from "./id-icon";
import InviteButton from "./invite-button";

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
            <p>{"Només el creador pot eliminar aquest projecte"}</p>
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
            <p>{"No es pot eliminar l'únic projecte propi"}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <DeleteProjectButton projectId={project.id} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Usuaris</TableHead>
          <TableHead className="text-right">Accions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} className="hover:bg-[var(--card)]">
            <TableCell>
              <IdIcon id={project.id} />
            </TableCell>
            <TableCell>{project.name}</TableCell>
            <TableCell className="p-0">
              <UsersList users={project.users} />
            </TableCell>
            <TableCell className="flex flex-row items-center justify-end gap-2 p-2">
              <InviteButton project={project} />
              <Button variant="ghost" size="icon" aria-label="Editar">
                <Edit /> {/* TODO: implement edit */}
              </Button>
              <DeleteButton project={project} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
