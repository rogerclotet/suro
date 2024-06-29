import type { List } from "@/app/_data/list";
import { Settings } from "lucide-react";
import DeleteListButton from "./delete-list-button";
import EditListButton from "./edit-list-button";

export default function SettingsMenu({ list }: { list: List }) {
  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-square btn-ghost">
        <Settings />
      </summary>
      <ul className="menu dropdown-content z-[1] rounded-box bg-base-200 p-2 shadow-xl">
        <li className="p-0">
          <EditListButton list={list} />
        </li>
        <li className="p-0">
          <DeleteListButton list={list} />
        </li>
      </ul>
    </details>
  );
}
