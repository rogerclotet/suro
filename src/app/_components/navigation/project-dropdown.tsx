import { db } from "@/server/db";

export default async function ProjectSelector() {
  const projects = await db.query.projects.findMany();

  return (
    <select className="select select-bordered w-full max-w-xs">
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
      <option value="new">+ Nou projecte</option>
    </select>
  );
}
