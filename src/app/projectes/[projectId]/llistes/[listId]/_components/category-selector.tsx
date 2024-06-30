import { useSelectedProject } from "@/app/_state/project-state";

export default function CategorySelector() {
  const { project } = useSelectedProject();

  console.log(project);

  return (
    <select className="select select-bordered select-sm">
      <option value="">Sense categoria</option>
      {project?.categories.map((category) => (
        <option key={category.id}>{category.name}</option>
      ))}
    </select>
  );
}
