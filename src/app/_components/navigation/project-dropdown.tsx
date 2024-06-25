import { db } from "@/server/db";

export default async function ProjectDropdown() {
  const projects = await db.query.projects.findMany();

  return (
    <details className="dropdown">
      <summary>Projecte</summary>
      <ul tabIndex={0} className="menu mt-2 gap-2 pl-2">
        {projects.map((project) => (
          <li key={project.id}>
            <a href="#">{project.name}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
