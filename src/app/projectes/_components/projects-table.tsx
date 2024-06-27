"use client";

import { Edit, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "../../_state/projects";
import DeleteProjectButton from "../_components/delete-project-button";
import UsersList from "../_components/users-list";
import InviteButton from "./invite-button";

export default function ProjectsTable() {
  const isLoading = useProjectsStore((state) => state.isLoading);
  const projects = useProjectsStore((state) => state.projects);

  if (isLoading) {
    return (
      <div className="flex h-[200px] justify-center">
        <span className="loading loading-spinner" />
      </div>
    );
  }

  async function copyIdToClipboard(id: string) {
    await navigator.clipboard.writeText(id);
    toast.info("Copiat al porta-retalls");
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
                <div
                  onClick={() => copyIdToClipboard(project.id)}
                  className="tooltip tooltip-right cursor-pointer"
                  data-tip={project.id}
                >
                  <Fingerprint />
                </div>
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
                <DeleteProjectButton project={project} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
