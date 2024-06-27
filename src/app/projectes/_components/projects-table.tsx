"use client";

import { Edit, UserPlus } from "lucide-react";
import { useProjectsStore } from "../../_state/projects";
import DeleteProjectButton from "../_components/delete-project-button";
import UsersList from "../_components/users-list";

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
              <td>{project.id}</td>
              <td>{project.name}</td>
              <td className="p-0">
                <UsersList users={project.users} />
              </td>
              <td className="flex flex-row gap-2">
                <div className="tooltip" data-tip="Convidar usuaris">
                  <button
                    aria-label="Convidar"
                    className="btn btn-square btn-ghost btn-sm"
                  >
                    <UserPlus /> {/* TODO: implement invite */}
                  </button>
                </div>
                <div className="tooltip" data-tip="Editar">
                  <button
                    aria-label="Editar"
                    className="btn btn-square btn-ghost btn-sm"
                  >
                    <Edit /> {/* TODO: implement edit */}
                  </button>
                </div>
                <div className="tooltip" data-tip="Eliminar">
                  <DeleteProjectButton project={project} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
