import { useSelectedProject } from "@/app/_state/project-state";
import { Tag } from "lucide-react";
import NewCategoryButton from "./new-category-button";

export default function CategorySelector() {
  const { project } = useSelectedProject();

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-square btn-ghost btn-sm m-1">
        <div className="tooltip" data-tip="Categoria">
          <Tag />
        </div>
      </summary>

      <ul className="menu dropdown-content z-[1] max-w-md rounded-box bg-base-200 p-2 shadow-lg">
        {project?.categories.map((category) => (
          <li key={category.id}>
            <a className="text-nowrap">{category.name}</a>
          </li>
        ))}
        <li>
          <NewCategoryButton />
        </li>
      </ul>
    </details>
  );
}
