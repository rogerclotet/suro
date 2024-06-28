import type { Project } from "@/app/_data/project";
import { auth } from "@/auth";
import { getProjects } from "@/server/projects";
import { Edit, Trash2 } from "lucide-react";
import DeleteProjectButton from "../_components/delete-project-button";
import UsersList from "../_components/users-list";
import IdIcon from "./id-icon";
import InviteButton from "./invite-button";

export default async function ProjectsTable() {
  const projects = await getProjects();

  async function DeleteButton({ project }: { project: Project }) {
    if (projects.length < 1) {
      return (
        <div
          className="tooltip tooltip-left"
          data-tip="No es pot eliminar l'únic projecte"
        >
          <button
            disabled
            aria-label="Eliminar"
            className="btn btn-square btn-error btn-sm"
          >
            <Trash2 />
          </button>
        </div>
      );
    }

    const session = await auth();
    if (project.createdBy !== session?.user.id) {
      return (
        <div
          className="tooltip tooltip-left"
          data-tip="Només el creador pot eliminar aquest projecte"
        >
          <button
            disabled
            aria-label="Eliminar"
            className="btn btn-square btn-error btn-sm"
          >
            <Trash2 />
          </button>
        </div>
      );
    }

    return <DeleteProjectButton projectId={project.id} projects={projects} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Nom</th>
            <th>Usuaris</th>
            <th className="w-40">Accions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="hover">
              <td>
                <IdIcon id={project.id} />
              </td>
              <td>{project.name}</td>
              <td className="p-0">
                <UsersList users={project.users} />
              </td>
              <td className="flex flex-row gap-2">
                <InviteButton project={project} />
                <button
                  aria-label="Editar"
                  className="btn btn-square btn-ghost btn-sm"
                >
                  <Edit /> {/* TODO: implement edit */}
                </button>
                <DeleteButton project={project} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
